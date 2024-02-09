import { bot } from '../../config.js'
import { getUserMessage } from '../utils.js'
import { getDate, getTime } from './time.js'

export const editEventName = async chatId => {
	const text = await getUserMessage(chatId, true, {
		question: 'Введите новое название мероприятия',
		cancelMessage: 'Изменение мероприятия отменено',
		answer: 'Имя мероприятия изменено'
	})

	if (text)
		return text.trim()
}

export const editEventMessage = async chatId => {
	const message = await getUserMessage(chatId, false, {
		question: 'Введите новое сообщение для напоминания о мероприятии',
		cancelMessage: 'Изменение мероприятия отменено',
		answer: 'Сообщение напоминания изменено'
	})

	if (message)
		return { id: message.message_id, fromId: message.from.id }
}

export const editEventDate = async (chatId, event) => {
	event.date = await getDate(chatId)

	if (!event.date) {
		bot.sendMessage(chatId, 'Извините,что-то пошло не так, дата не изменена')

		return
	}

	bot.sendMessage(chatId, 'Дата мероприятия обновлена')

	return event.date
}

export const editEventTime = async (chatId, event) => {
	event.time = await getTime(chatId)

	if (!event.time) {
		bot.sendMessage(chatId, 'Извините,что-то пошло не так, время уведомлений не задано')

		return
	}

	bot.sendMessage(chatId, 'Время уведомлений изменено')

	return event.time
}