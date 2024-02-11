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
	initEvents,
	editHelloText
} from './utils/adminUtils/admin.js'

const sendMessage = () => {
}

const start = async ({ chat }) => {
	const helloText = (JSON.parse(fs.readFileSync('tempdb.json', 'utf8')).helloText || 'Привет, {first_name}')
		.replace(/{first_name}/g, chat.first_name || '')
		.replace(/{last_name}/g, chat.last_name || '')

	const commands = adminIds.includes(chat.id)
		? [
			[ { text: 'Мои мероприятия' }, { text: 'Подписаться на мероприятие' } ],
			[ { text: 'Редактировать приветствие' }, { text: 'Отправить пользователям сообщение' } ],
			[ { text: 'Добавить мероприятие' }, { text: 'Удалить мероприятие' } ],
			[ { text: 'Все мероприятия' } ],
			[ { text: 'Добавить напоминание' } ]
		]
		: [ [ { text: 'Мои мероприятия' } ], [ { text: 'Подписаться на мероприятие' } ] ]

	addSub(chat.id)
	await bot.sendMessage( chat.id, helloText, { reply_markup: { keyboard: commands } })
	await chooseEvent(chat.id)
}

const init = () => {
	initEvents()

	bot.onText(/\/start/, start)

	bot.onText(/Мои мероприятия/, getUserEvents)
	bot.onText(/Подписаться на мероприятие/, getOtherEvents)

	bot.onText(/Редактировать приветствие/, editHelloText)
	bot.onText(/Отправить сообщение/, sendMessage)

	bot.onText(/Добавить мероприятие/, addEvent)
	bot.onText(/Удалить мероприятие/, deleteEventCommand)
	bot.onText(/Редактировать мероприятие/, editEvent)
	bot.onText(/Добавить напоминание/, addReminder)
}

init()