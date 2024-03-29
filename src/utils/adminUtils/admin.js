import fs from 'fs'

import { bot } from '../../config.js'
import { editEventName, editReminders, editEventDate } from './editEvents.js'
import { delayDate, getDate, getTime, parseDateTime } from './time.js'
import {
	getUserMessage,
	isMedia,
	sendNameMessage,
	splitArray,
	updateJsonFile,
	checkHandleMessage
} from '../utils.js'

export const adminIds = JSON.parse(fs.readFileSync('tempdb.json', 'utf-8')).adminIds || []
export let events = JSON.parse(fs.readFileSync('tempdb.json', 'utf-8')).events || []

export const adminCommands = [
	[ { text: 'Редактировать приветствие' }, { text: 'Отправить сообщение' } ],
	[ { text: 'Добавить мероприятие' }, { text: 'Удалить мероприятие' } ],
	[ { text: 'Редактировать мероприятие' } ],
	[ { text: 'Добавить напоминание' } ]
]

export const editHelloText = async ({ chat }) => {
	const helloText = await getUserMessage(chat.id, true, {
		question: 'Введите текст приветствия.\nДля того чтобы обратиться к пользователю по имени напишите вместо имени {first_name}, для обращения по фамилии напишите вместо фамилии {last_name}',
		answer: 'Текст приветствия обновлён',
		cancelMessage: 'Обновление приветственного текста отменено'
	})

	if (checkHandleMessage(helloText))
		return

	updateJsonFile('helloText', helloText)
}

export const addAdmin = async ({ chat }) => {
	if (!adminIds.find(admin => admin === chat.id)) {
		adminIds.push(chat.id)
		updateJsonFile('adminIds', adminIds)

		await bot.sendMessage(
			chat.id,
			'Поздравляю, теперь ты админ\nЕсли кнопки администратора не появились, напишите /start и перезапустите телеграм',
			{ reply_markup: { keyboard: adminCommands } }
		)
	}
	else
		await bot.sendMessage(chat.id, 'Ну ты чего, ты же уже админ\nЕсли кнопки администратора не появились, перезапустите телеграм')
}

export const sendMessage = async ({ chat }) => {
	if (!adminIds.includes(chat.id))
		return await bot.sendMessage(chat.id, 'Извините, но эта команда доступна только администраторам бота')

	await bot.sendMessage(
		chat.id,
		'Участникам какого мероприятия вы бы хотели отправить сообщение',
		{ reply_markup: { inline_keyboard: [ [ { text: 'Сообщение для всех', callback_data: 'all' } ], ...splitArray(events, 3) ] } }
	)

	const handleMessage = async ({ message, data }) => {
		if (message.chat.id !== chat.id)
			return

		bot.off('callback_query', handleMessage)

		const msg = await getUserMessage(chat.id, false, {
			question: 'Введите сообщение, которое отправится пользователям',
			answer: 'Сообщение отправляется',
			cancelMessage: 'Отправка сообщения отменена'
		})

		if (!checkHandleMessage(msg.text))
			return

		const { subs } = JSON.parse(fs.readFileSync('tempdb.json', 'utf-8'))
		if (data === 'all')
			subs.forEach(user => {
				if (isMedia(msg))
					bot.copyMessage(user.id, chat.id, msg.message_id)
				else
					sendNameMessage(user, msg.text)
			})
		else
			events.find(event => event.text === data).subs
				.forEach(userId => {
					if (isMedia(msg))
						bot.copyMessage(userId, chat.id, msg.message_id)
					else
						sendNameMessage(subs.find(user => user.id === userId), msg.text)
				})

		await bot.sendMessage(chat.id, 'Сообщение отправлено')
	}

	bot.on('callback_query', handleMessage)
}

export const addEvent = async ({ chat }) => {
	if (!adminIds.includes(chat.id))
		return await bot.sendMessage(chat.id, 'Извините, но эта команда доступна только администраторам бота')

	let text = await getUserMessage(chat.id, true, {
		question: 'Как называется ваше мероприятие',
		cancelMessage: 'Добавление мероприятия отменено'
	})

	if (!text || checkHandleMessage(text))
		return
	text = text.trim()

	let description = await getUserMessage(chat.id, false, {
		question: 'Добавьте описание к вашему мероприятию',
		cancelMessage: 'Добавление мероприятия отменено'
	})

	if (!description || checkHandleMessage(description.text))
		return

	const date = await getDate(chat.id)
	const time = await getTime(chat.id, 'Введите время, в которое пройдет мероприятие\nНапример: 10:00')

	if (!time || !time.length) {
		await bot.sendMessage(chat.id, 'Что-то пошло не так, попробуйте еще раз добавить мероприятие')

		return
	}

	await bot.sendMessage(chat.id, `Мероприятие ${text} запланировано на ${date} ${time}`)

	events.push({
		text,
		description: { chatId: description.chat.id, messageId: description.message_id },
		date: parseDateTime(date, time),
		callback_data: text,
		subs: [],
		reminders: []
	})
	setTimeout(() => events.at(-1).subs = [], delayDate(events.at(-1).date))

	updateJsonFile('events', events)
}

export const deleteEvent = text => {
	const deletingEventIdx = events.findIndex(event => event.text === text)

	if (deletingEventIdx !== -1) {
		events.splice(deletingEventIdx, 1)
		updateJsonFile('events', events)
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

	const handleCallbackQuery = async ({ data, message }) => {
		if (message.chat.id !== chat.id)
			return

		bot.off('callback_query', handleCallbackQuery)

		const deletingEventIdx = events.findIndex(event => event.text === data)

		if (deletingEventIdx !== -1) {
			events.splice(deletingEventIdx, 1)
			updateJsonFile('events', events)

			await bot.sendMessage(chat.id, `Мероприятие ${data} удалено`)
		}
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

	const handleEditingEvent = async ({ data, message }) => {
		if (message.chat.id !== chat.id)
			return

		bot.off('callback_query', handleEditingEvent)

		const editingEventIdx = events.findIndex(event => event.text === data)
		if (editingEventIdx === -1) {
			await bot.sendMessage(chat.id, `Мероприятие ${data} не найдено`)

			return
		}

		await bot.sendMessage( chat.id, 'Что вы хотите изменить', {
			reply_markup: { inline_keyboard: [
				[ { text: 'Название', callback_data: 'editname' } ],
				[ { text: 'Редактировать напоминания', callback_data: 'editreminders' } ],
				[ { text: 'Дата мероприятия', callback_data: 'editdate' } ]
			] }
		})

		const handleEditType = async ({ data, message }) => {
			if (message.chat.id === chat.id) {
				bot.off('callback_query', handleEditType)

				switch (data) {
				case 'editname':
					events[editingEventIdx].text = events[editingEventIdx].callback_data = await editEventName(chat.id) || events[editingEventIdx].text
					break
				case 'editreminders':
					events[editingEventIdx].message = await editReminders(chat.id, editingEventIdx) || events[editingEventIdx].message
					break
				case 'editdate':
					events[editingEventIdx].date = await editEventDate(chat.id, events[editingEventIdx]) || events[editingEventIdx].date
					break
				}

				updateJsonFile('events', events)
			}
		}

		bot.on('callback_query', handleEditType)
	}

	bot.on('callback_query', handleEditingEvent)
}