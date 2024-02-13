import fs from 'fs'

import { bot } from '../../config.js'
import { splitArray, getUserMessage, updateJsonFile } from '../utils.js'
import { adminIds, events } from './admin.js'
import { getDate, getTime, parseDateTime } from './time.js'

export const createReminder = async (chatId, eventName) => {
	const msg = await getUserMessage(chatId, false, {
		question: 'Введите текст напоминания. Так же добавьте файлы, видео или фото',
		cancelMessage: 'Добавление мероприятия отменено'
	})
	const date = parseDateTime(await getDate(chatId, 'Когда отправить напоминание'), await getTime(chatId))

	if (date <= new Date())
		return await bot.sendMessage(chatId, 'Извините, но напоминание отменено. Купите DeLorean, чтобы отправиться в прошлое и отправить напоминание там')

	if (eventName === 'all')
		setTimeout(() => JSON.parse(fs.readFileSync('tempdb.json', 'utf-8')).subs.forEach(userId => bot.copyMessage(userId, chatId, msg.id)), date - new Date())
	else {
		const eventIdx = events.findIndex(event => event.text === eventName)
		console.log(date - new Date() - 3_600_000)
		events[eventIdx].reminders[date] = setTimeout(() => {
			console.log(events[eventIdx].subs)
			events[eventIdx].subs
				.forEach(userId => bot.copyMessage(userId, chatId, msg.message_id))
		}, date - new Date() - 3_600_000)
	}

	bot.sendMessage(chatId, 'Напоминание создано')

	updateJsonFile('events', events)
}

export const addReminder = async ({ chat }) => {
	if (!adminIds.includes(chat.id))
		return await bot.sendMessage(chat.id, 'Извините, но эта команда доступна только администраторам бота')

	await bot.sendMessage(
		chat.id,
		'К какому мероприятию вы бы хотели добавить напоминание',
		{ reply_markup: { inline_keyboard: [ [ { text: 'Напоминание для всех', callback_data: 'all' } ], ...splitArray(events, 3) ] } }
	)

	const handleChooseEvent = async ({ data }) => {
		createReminder(chat.id, data)

		bot.off('callback_query', handleChooseEvent)
	}

	bot.on('callback_query', handleChooseEvent)
}

export const deleteReminder = (eventId, reminderDate) => clearTimeout(events[eventId].reminders[reminderDate])