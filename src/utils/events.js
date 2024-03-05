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

		await bot.sendMessage(chatId, `Спасибо, что Вы зарегистрировались на ${data}\nПожалуйста, запишите себе в календарь, чтобы не пропустить.\nМы пришлем Вам ссылку на вход незадолго до мероприятия🧧`)
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

		const handleCallbackQuery = async ({ data, message }) => {
			await bot.deleteMessage(chatId, message_id)

			eventSubscribe(chatId, data, message)
			bot.off('callback_query', handleCallbackQuery)
		}
		bot.on('callback_query', handleCallbackQuery)
	}
	else {
		bot.sendMessage(chatId, 'Ой-ой, мы готовим новые блюда на нашей интеллектуальной кухне. Но пока ещё не готово. Мы скоро Вас позовем👌🛋️🍹')

		return
	}
})

export const getUserEvents = async ({ chat }) => {
	const userEvents = events
		.filter(event => event.subs.includes(chat.id) && delayDate(new Date(event.date)) >= 0)
		.map(event => `На ${event.date.split`T`[0]} запланировано ${event.text}`).join`\n`

	await bot.sendMessage(chat.id, userEvents.length
		? `Вы решили прийти к нам эти мероприятия, мы Вас очень ждём❤️\n${userEvents}`
		: 'Ой, так Вы никуда не записались. Выбирайте скорее по соседей кнопке. У нас познавательно 🇪🇺🇺🇸🇬🇧🇵🇹🇮🇱🇲🇪🇮🇩🇨🇭🇨🇾🇰🇿🇬🇪 и душевно✨📖👇'
	)
}

export const getOtherEvents = async ({ chat }) => {
	if (!events.length)
		return await bot.sendMessage(chat.id, 'Ой-ой, мы готовим новые блюда на нашей интеллектуальной кухне. Но пока ещё не готово. Мы скоро Вас позовем👌🛋️🍹')

	const otherEvents = events.filter(event => !event.subs.includes(chat.id))

	if (!otherEvents.length)
		return await bot.sendMessage(chat.id, 'Так-так, а Вы уже везде записались👌 גאפךא До скорой встречи в эфире🌳')

	const { message_id } = await bot.sendMessage(
		chat.id,
		'Мы сами ждём не дождёмся и Вы присоединяйтесь!🤗',
		{ reply_markup: { inline_keyboard: splitArray(otherEvents, 3) } }
	)

	const handleCallbackQuery = async ({ data, message }) => {
		await bot.deleteMessage(chat.id, message_id)

		eventSubscribe(chat.id, data, message)
		bot.off('callback_query', handleCallbackQuery)
	}
	bot.on('callback_query', handleCallbackQuery)
}