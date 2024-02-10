import fs from 'fs'

import { bot } from '../../config.js'
import { editEventName, editEventMessage, editEventDate, editEventTime } from './editEvents.js'
import { getDate, getTime, parseDateTime } from './time.js'
import { getUserMessage, splitArray, updateJsonFile } from '../utils.js'

export const adminIds = [ 484526571, 1242013874 ]
export let events = []

export const initEvents = () => events = JSON.parse(fs.readFileSync('tempdb.json', 'utf-8')).events || []

export const editHelloText = async ({ chat }) => {
	const helloText = await getUserMessage(chat.id, true, {
		question: 'Введите текст приветствия.\nДля того чтобы обратиться к пользователю по имени напишите вместо имени {first_name}, для обращения по фамилии напишите вместо фамилии {last_name}',
		answer: 'Текст приветствия обновлён',
		cancelMessage: 'Обновление приветственного текста отменено'
	})

	updateJsonFile('helloText', helloText)
}

export const addEvent = async ({ chat }) => {
	if (!adminIds.includes(chat.id))
		return await bot.sendMessage(chat.id, 'Извините, но эта команда доступна только администраторам бота')

	let text = await getUserMessage(chat.id, true, {
		question: 'Как называется ваше мероприятие',
		cancelMessage: 'Добавление мероприятия отменено'
	})

	if (!text)
		return
	text = text.trim()

	const date = await getDate(chat.id)
	const time = await getTime(chat.id, 'Введите время, в которое пройдет мероприятие\nНапример: 10:00')

	if (!time || !time.length) {
		await bot.sendMessage(chat.id, 'Что-то пошло не так, попробуйте еще раз добавить мероприятие')

		return
	}

	await bot.sendMessage(chat.id, `Мероприятие запланировано на ${date} ${time}`)

	console.log(parseDateTime(date, time))

	events.push({ text, date: parseDateTime(date, time), callback_data: name, subs: [], reminders: [] })
	updateJsonFile('events', events)
}

export const deleteEvent = text => {
	const deletingEventIdx = events.findIndex(event => event.text === text)

	if (deletingEventIdx !== -1) {
		events.splice(deletingEventIdx, 1)
		fs.writeFileSync('tempdb.json', JSON.stringify({ events }), 'utf-8')
	}
}

export const deleteEventCommand = async ({ chat }) => {
	if (!adminIds.includes(chat.id))
		return await bot.sendMessage(chat.id, 'Извините, но эта команда доступна только администраторам бота')

	if (events.length)
		await bot.sendMessage(
			chat.id,
			'Какое мероприятие вы хотите удалить',
			{ reply_markup: { inline_keyboard: splitArray(events, 3) } }
		)
	else
		return await bot.sendMessage(chat.id, 'Cейчас не запланировано никаких мероприятий')

	const handleCallbackQuery = async ({ data }) => {
		const deletingEventIdx = events.findIndex(event => event.text === data)

		if (deletingEventIdx !== -1) {
			events.splice(deletingEventIdx, 1)
			fs.writeFileSync('tempdb.json', JSON.stringify({ events }), 'utf-8')

			await bot.sendMessage(chat.id, `Мероприятие ${data} удалено`)
		}

		bot.off('callback_query', handleCallbackQuery)
	}

	bot.on('callback_query', handleCallbackQuery)
}

export const editEvent = async ({ chat }) => {
	if (!adminIds.includes(chat.id))
		return await bot.sendMessage(chat.id, 'Извините, но эта команда доступна только администраторам бота')

	if (events.length)
		await bot.sendMessage(
			chat.id,
			'Какое мероприятие вы хотите отредактировать',
			{ reply_markup: { inline_keyboard: splitArray(events, 3) } }
		)
	else
		return await bot.sendMessage(chat.id, 'Cейчас не запланировано никаких мероприятий')

	const handleEditingEvent = async ({ data }) => {
		const editingEventIdx = events.findIndex(event => event.text === data)
		if (editingEventIdx === -1) {
			await bot.sendMessage(chat.id, `Мероприятие ${data} не найдено`)

			return
		}

		await bot.sendMessage( chat.id, 'Что вы хотите изменить', {
			reply_markup: { inline_keyboard: [
				[ { text: 'Название', callback_data: 'editname' }, { text: 'Содержание', callback_data: 'editmsg' } ],
				[ { text: 'Дата', callback_data: 'editdate' }, { text: 'Время уведомлений', callback_data: 'edittime' } ]
			] }
		})

		const handleEditType = async ({ data }) => {
			switch (data) {
			case 'editname':
				events[editingEventIdx].text = events[editingEventIdx].callback_data = await editEventName(chat.id) || events[editingEventIdx].text
				break
			case 'editmsg':
				events[editingEventIdx].message = await editEventMessage(chat.id) || events[editingEventIdx].message
				break
			case 'editdate':
				events[editingEventIdx].date = await editEventDate(chat.id, events[editingEventIdx]) || events[editingEventIdx].date
				break
			case 'edittime':
				events[editingEventIdx].time = await editEventTime(chat.id, events[editingEventIdx]) || events[editingEventIdx].time
				break
			}

			fs.writeFileSync('tempdb.json', JSON.stringify({ events }), 'utf-8')
			bot.off('callback_query', handleEditType)
		}

		bot.off('callback_query', handleEditingEvent)
		bot.on('callback_query', handleEditType)
	}

	bot.on('callback_query', handleEditingEvent)
}