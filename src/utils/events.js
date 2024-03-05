import { bot } from '../config.js'
import { splitArray, updateJsonFile } from './utils.js'
import { events } from './adminUtils/admin.js'
import { delayDate } from './adminUtils/time.js'

const eventSubscribe = async (chatId, data, { chat }) => {
	if (chat.id === chatId || chat === -1) {
		const updatingEvent = events.find(event => event.text === data)
		if (!updatingEvent)
			return

		await bot.copyMessage(chatId, updatingEvent.description.chatId, updatingEvent.description.messageId)
		await bot.sendMessage(
			chatId,
			`Желаете получать новости по поводу мероприятия ${updatingEvent.text}`,
			{ reply_markup: { inline_keyboard: [ [ { text: 'Конечно', callback_data: 'true' }, { text: 'Нет', callback_data: 'false' } ] ] } }
		)

		const handleSubAgree = async ({ data, message }) => {
			if (chatId !== message.chat.id)
				return

			bot.off('callback_query', handleSubAgree)

			if (data === 'true') {
				updatingEvent.subs.push(chatId)
				updateJsonFile('events', events)

				await bot.sendMessage(chatId, `Спасибо, что Вы зарегистрировались на ${data}\nПожалуйста, запишите себе в календарь, чтобы не пропустить.\nМы пришлем Вам ссылку на вход незадолго до мероприятия🧧`)
			}

			await bot.sendMessage(
				chatId,
				'Возможно вы желаете подписаться на другие мероприятия',
				{ reply_markup: { inline_keyboard: [ [ { text: 'Конечно', callback_data: 'true' }, { text: 'Нет', callback_data: 'false' } ] ] } }
			)

			const handlePlusSub = async ({ data, message }) => {
				if (chatId !== message.chat.id)
					return
				bot.off('callback_query', handleSubAgree)

				if (data === 'true')
					getOtherEvents({ chat })
				else
					await bot.sendMessage(chatId, 'Очень жаль, ждём вас в будущем')
			}
			bot.on('callback_query', handlePlusSub)
		}
		bot.on('callback_query', handleSubAgree)
	}
}

export const chooseEvent = async chatId => new Promise(() => {
	if (events.length === 1)
		eventSubscribe(chatId, events[0].text, { chat: -1 })
	else if (events.length > 1) {
		const { message_id } = bot.sendMessage(
			chatId,
			'Мы сами ждём не дождёмся и Вы присоединяйтесь!',
			{ reply_markup: { inline_keyboard: splitArray(events, 3) } }
		)

		const handleChooseEvent = async ({ data, message }) => {
			if (chatId !== message.chat.id)
				return

			bot.off('callback_query', handleChooseEvent)

			await bot.deleteMessage(chatId, message_id)
			eventSubscribe(chatId, data, message)
		}
		bot.on('callback_query', handleChooseEvent)
	}
	else {
		bot.sendMessage(chatId, 'Ой-ой, мы готовим новые блюда на нашей интеллектуальной кухне. Но пока ещё не готово. Мы скоро Вас позовем👌🛋️🍹')

		return
	}
})

export const getUserEvents = async ({ chat }) => {
	const userEvents = events.filter(event =>
		event.subs.includes(chat.id) && delayDate(new Date(event.date)) >= 0)

	if (userEvents.length)
		await bot.sendMessage(
			chat.id,
			'Вы решили прийти к нам эти мероприятия, мы Вас очень ждём❤️',
			{ reply_markup: { inline_keyboard: splitArray(userEvents, 3) } }
		)
	else
		await bot.sendMessage(chat.id, 'Ой, так Вы никуда не записались. Выбирайте скорее по соседей кнопке. У нас познавательно и душевно✨📖👇')

	const handleInterestingEvent = async ({ data, message }) => {
		if (chat.id !== message.chat.id)
			return

		bot.off('callback_query', handleInterestingEvent)

		const { description } = userEvents.find(event => event.text === data)
		bot.copyMessage(chat.id, description.chatId, description.messageId)
	}
	bot.on('callback_query', handleInterestingEvent)
}

export const getOtherEvents = async ({ chat }) => {
	if (!events.length)
		return await bot.sendMessage(chat.id, 'Ой-ой, мы готовим новые блюда на нашей интеллектуальной кухне. Но пока ещё не готово. Мы скоро Вас позовем👌🛋️🍹')

	const otherEvents = events.filter(event => !event.subs.includes(chat.id))

	if (!otherEvents.length)
		return await bot.sendMessage(chat.id, 'Так-так, а Вы уже везде записались👌. До скорой встречи в эфире🌳')

	if (events.length === 1)
		eventSubscribe(chat.id, events[0].text, { chat: -1 })
	else {
		const { message_id } = await bot.sendMessage(
			chat.id,
			'Мы сами ждём не дождёмся и Вы присоединяйтесь!🤗',
			{ reply_markup: { inline_keyboard: splitArray(otherEvents, 3) } }
		)

		const handleSubEvent = async ({ data, message }) => {
			if (chat.id !== message.chat.id)
				return

			bot.off('callback_query', handleSubEvent)

			await bot.deleteMessage(chat.id, message_id)
			eventSubscribe(chat.id, data, message)
		}
		bot.on('callback_query', handleSubEvent)
	}
}