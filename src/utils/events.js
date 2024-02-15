import { bot } from '../config.js'
import { splitArray, updateJsonFile } from './utils.js'
import { events } from './adminUtils/admin.js'
import { delayDate } from './adminUtils/time.js'

const eventSubscribe = async (chatId, data, { chat }) => {
	if (chat.id === chatId || chat === -1) {
		const updatingEvent = events.find(event => event.text === data)
		if (!updatingEvent)
			return

		updatingEvent.subs.push(chatId)
		updateJsonFile('events', events)

		await bot.sendMessage(chatId, `Вы подписались на мероприятие ${data}`)
	}
}

export const chooseEvent = async chatId => new Promise(() => {
	if (events.length === 1)
		eventSubscribe(chatId, events[0].text, { chat: -1 })
	else if (events.length > 1) {
		const { message_id } = bot.sendMessage(
			chatId,
			'Выберите мероприятие',
			{ reply_markup: { inline_keyboard: splitArray(events, 3) } }
		)

		const handleCallbackQuery = async ({ data, message }) => {
			await bot.deleteMessage(chatId, message_id)

			eventSubscribe(chatId, data, message)
			bot.off('callback_query', handleCallbackQuery)
		}
		bot.on('callback_query', handleCallbackQuery)
	}
	else {
		bot.sendMessage(chatId, 'Сейчас не запланировано никаких мероприятий')

		return
	}
})

export const getUserEvents = async ({ chat }) => {
	const userEvents = events
		.filter(event => event.subs.includes(chat.id) && delayDate(new Date(event.date)) >= 0)
		.map(event => `На ${event.date.split`T`[0]} запланировано ${event.text}`).join`\n`

	await bot.sendMessage(chat.id, userEvents.length ? userEvents : 'У вас нет запланированных мероприятий')
}

export const getOtherEvents = async ({ chat }) => {
	if (!events.length)
		return await bot.sendMessage(chat.id, 'В ближайшее время не планируется никаких мероприятий')

	const otherEvents = events.filter(event => !event.subs.includes(chat.id))

	if (!otherEvents.length)
		return await bot.sendMessage(chat.id, 'Вы уже подписаны на все возможные мероприятия')

	const { message_id } = await bot.sendMessage(
		chat.id,
		'Выберите мероприятие, на которое вы хотели бы подписаться',
		{ reply_markup: { inline_keyboard: splitArray(otherEvents, 3) } }
	)

	const handleCallbackQuery = async ({ data, message }) => {
		await bot.deleteMessage(chat.id, message_id)

		eventSubscribe(chat.id, data, message)
		bot.off('callback_query', handleCallbackQuery)
	}
	bot.on('callback_query', handleCallbackQuery)
}