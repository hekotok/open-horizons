import fs from 'fs'

import { bot } from './config.js'
import { addSub } from './utils/utils.js'
import { chooseEvent, getUserEvents, getOtherEvents } from './utils/events.js'
import { addReminder } from './utils/adminUtils/reminders.js'
import {
	addEvent,
	deleteEventCommand,
	editEvent,
	adminIds,
	editHelloText,
	sendMessage,
	addAdmin
} from './utils/adminUtils/admin.js'

const start = async ({ chat, from: user }) => {
	const helloText = (JSON.parse(fs.readFileSync('tempdb.json', 'utf8')).helloText || 'Привет, {first_name}')
		.replace(/{first_name}/g, chat.first_name || '')
		.replace(/{last_name}/g, chat.last_name || '')

	const adminCommands = [
		[ { text: 'Редактировать приветствие' }, { text: 'Отправить сообщение' } ],
		[ { text: 'Добавить мероприятие' }, { text: 'Удалить мероприятие' } ],
		[ { text: 'Редактировать мероприятие' } ],
		[ { text: 'Добавить напоминание' } ]
	]

	bot.setMyCommands([
		{ command: 'myevents', description: 'Мои мероприятия' },
		{ command: 'subscribe', description: 'А что ещё интересного будет?' }
	])

	addSub(user)

	await bot.sendMessage(chat.id, helloText, adminIds.includes(chat.id) ? { reply_markup: { keyboard: adminCommands } } : {})
	await chooseEvent(chat.id)
}

const init = () => {
	bot.onText(/\/start/, start)
	bot.onText(/\/inewadmin/, addAdmin)

	bot.onText(/\/myevents/, getUserEvents)
	bot.onText(/\/subscribe/, getOtherEvents)

	bot.onText(/Редактировать приветствие/, editHelloText)
	bot.onText(/Отправить сообщение/, sendMessage)

	bot.onText(/Добавить мероприятие/, addEvent)
	bot.onText(/Удалить мероприятие/, deleteEventCommand)
	bot.onText(/Редактировать мероприятие/, editEvent)
	bot.onText(/Добавить напоминание/, addReminder)
}

init()