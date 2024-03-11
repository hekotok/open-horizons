import { bot } from '../../config.js'
import { getUserMessage, splitArray } from '../utils.js'
import { events } from './admin.js'
import { createReminder, deleteReminder } from './reminders.js'
import { getDate, getTime, parseDateTime } from './time.js'

export const editEventName = async chatId => {
	return await getUserMessage(chatId, true, {
		question: 'Введите новое название мероприятия',
		cancelMessage: 'Изменение мероприятия отменено',
		answer: 'Имя мероприятия изменено'
	}) || null
}

export const editReminders = async (chatId, eventIdx) => {
	const reminders = splitArray(events[eventIdx].reminders.map(reminder => ({
		text: reminder.date.toISOString().split`T`.join` `.replace(':00.000Z', ''),
		callback_data: reminder.id
	})), 2)

	bot.sendMessage(
		chatId,
		'Добавьте новое напоминание или удалите имеющееся',
		{ reply_markup: { inline_keyboard: reminders && reminders.length
			? [ [ { text: 'Добавить новое напоминание', callback_data: 'new' } ], ...reminders ]
			: [ [ { text: 'Создайте первое напоминание', callback_data: 'new' } ] ] } }
	)

	const handleChooseReminder = async ({ data, message }) => {
		if (message.chat.id !== chatId)
			return

		bot.off('callback_query', handleChooseReminder)

		if (data === 'new')
			createReminder(chatId, events[eventIdx].text)
		else {
			const reminderId = data
			const { message_id } = await bot.sendMessage(
				chatId,
				'Желаете удалить это напоминание?',
				{ reply_markup: { inline_keyboard: [
					[ { text: 'Удалить напоминание', callback_data: 'del' } ],
					[ { text: 'Не изменять напоминание', callback_data: 'cancel' } ]
				] } }
			)

			const handleEditReminder = async ({ data, message }) => {
				if (message.chat.id !== chatId)
					return

				bot.off('callback_query', handleEditReminder)

				data === 'del' && deleteReminder(eventIdx, +reminderId)

				bot.deleteMessage(chatId, message_id)
			}

			bot.on('callback_query', handleEditReminder)
		}
	}

	bot.on('callback_query', handleChooseReminder)
}

export const editEventDate = async (chatId, event) => {
	const [ date, time ] = [ await getDate(chatId), await getTime(chatId) ]

	if (!date || !time) {
		bot.sendMessage(chatId, 'Извините,что-то пошло не так, дата не изменена')

		return
	}

	event.date = parseDateTime(date, time)
	await bot.sendMessage(chatId, 'Время уведомлений изменено')

	return event.date
}