import { bot } from '../../config.js'
import { splitArray } from '../utils.js'
import { adminIds, events } from './admin.js'

const createReminder = event => {
	console.log(event)
}

export const addReminder = async chat => {
	if (!adminIds.includes(chat.id))
		return await bot.sendMessage(chat.id, 'Извините, но эта команда доступна только администраторам бота')

	await bot.sendMessage(
		chat.id,
		'Какое мероприятие вы хотите удалить',
		{ reply_markup: {
			inline_keyboard: events.length
				? [ [ 'Напоминание для всех' ], ...splitArray(events, 3) ]
				: [ [ 'Напоминание для всех' ] ]
		} }
	)

	const handleChooseEvent = async ({ data }) => {
		createReminder(data)

		bot.off('callback_query', handleChooseEvent)
	}

	bot.on('callback_query', handleChooseEvent)
}

//export const deleteReminders = text => reminders[text] && reminders[text].forEach(reminder => clearTimeout(reminder))