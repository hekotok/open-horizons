import { bot } from '../config.js'
import { splitArray, updateJsonFile } from './utils.js'
import { events } from './adminUtils/admin.js'

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
	else if (events.length) {
		bot.sendMessage(
			chatId,
			'Выберите мероприятие',
			{ reply_markup: { inline_keyboard: splitArray(events, 3) } }
		)
		bot.on('callback_query', async ({ data, message }) => await eventSubscribe(chatId, data, message))
	}
	else {
		bot.sendMessage(chatId, 'Сейчас не запланировано никаких мероприятий')

		return
	}
})

export const getUserEvents = async ({ chat }) => {
	const userEvents = events.filter(event => event.subs.includes(chat.id))
		.map(event => `На ${event.date} запланировано ${event.text}`).join`\n`

	await bot.sendMessage(chat.id, userEvents.length ? userEvents : 'У вас нет запланированных мероприятий')
}

export const getOtherEvents = async ({ chat }) => {
	if (!events.length)
		return await bot.sendMessage(chat.id, 'В ближайшее время не планируется никаких мероприятий')

	const otherEvents = events.filter(event => !event.subs.includes(chat.id))

	if (!otherEvents.length)
		return await bot.sendMessage(chat.id, 'Вы уже подписаны на все возможные мероприятия')

	await bot.sendMessage(
		chat.id,
		'Выберите мероприятие, на которое вы хотели бы подписаться',
		{ reply_markup: { inline_keyboard: splitArray(otherEvents, 3) } }
	)
	bot.on('callback_query', async ({ data, message }) => await eventSubscribe(chat.id, data, message))
}