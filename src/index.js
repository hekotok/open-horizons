import fs from 'fs'

import { bot } from './config.js'
import { chooseEvent, getUserEvents, getOtherEvents } from './utils/events.js'
import {
	addEvent,
	deleteEventCommand,
	editEvent,
	adminIds,
	initEvents,
	editHelloText
} from './utils/adminUtils/admin.js'

const start = async ({ chat }) => {
	const helloText = (JSON.parse(fs.readFileSync('tempdb.json', 'utf8')).helloText || 'Привет, {first_name}')
		.replace(/{first_name}/g, chat.first_name || '')
		.replace(/{last_name}/g, chat.last_name || '')

	const commands = adminIds.includes(chat.id)
		? [
			[ { text: 'Мои мероприятия' }, { text: 'Подписаться на мероприятие' } ],
			[ { text: 'Редактировать приветствие' } ],
			[ { text: 'Добавить мероприятие' }, { text: 'Удалить мероприятие' } ],
			[ { text: 'Редактировать мероприятие' } ]
		]
		: [ [ { text: 'Мои мероприятия' } ], [ { text: 'Подписаться на мероприятие' } ] ]

	await bot.sendMessage( chat.id, helloText, { reply_markup: { keyboard: commands } })
	await chooseEvent(chat.id)
}

const init = () => {
	initEvents()

	bot.onText(/\/start/, start)

	bot.onText(/Мои мероприятия/, getUserEvents)
	bot.onText(/Подписаться на мероприятие/, getOtherEvents)

	bot.onText(/Редактировать приветствие/, editHelloText)
	bot.onText(/Добавить мероприятие/, addEvent)
	bot.onText(/Удалить мероприятие/, deleteEventCommand)
	bot.onText(/Редактировать мероприятие/, editEvent)
}

init()