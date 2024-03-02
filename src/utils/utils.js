import fs from 'fs'

import { bot } from '../config.js'

export const getUserMessage = async (chatId, needOnlyText, { question, answer, cancelMessage }) => new Promise(resolve => {
	const handleUserMessage = async msg => {
		if (msg.chat.id === chatId) {
			bot.off('message', handleUserMessage)

			if (msg.text === '/cancel') {
				cancelMessage && await bot.sendMessage(chatId, cancelMessage)
				resolve()
			}
			else {
				answer && await bot.sendMessage(chatId, answer)
				resolve(needOnlyText ? msg.text || msg.caption : msg)
			}
		}
	}

	bot.sendMessage(chatId, question)
	bot.on('message', handleUserMessage)
})

export const isMedia = msg => msg.document || msg.photo || msg.video || msg.location || msg.poll || msg.audio || msg.contact

export const sendNameMessage = async ({ id, first_name, last_name }, text) => await bot.sendMessage(id, text
	.replace(/{first_name}/g, first_name || '')
	.replace(/{last_name}/g, last_name || '')
)

export const splitArray = (arr, subarraySize) => {
	const resultArray = []

	for (let idx = 0; idx < arr.length; idx += subarraySize)
		resultArray.push(arr.slice(idx, idx + subarraySize))

	return resultArray
}

export const updateJsonFile = (property, value) => {
	const data = JSON.parse(fs.readFileSync('tempdb.json', 'utf8'))

	data[property] = value
	fs.writeFileSync('tempdb.json', JSON.stringify(data, null, 2), 'utf8')
}

export const addSub = ({ id, first_name, last_name }) => {
	const data = JSON.parse(fs.readFileSync('tempdb.json', 'utf8'))
	const newUser = { id, first_name, last_name }

	!data.subs && (data.subs = [ newUser ])
	!data.subs.find(user => user.id !== id) && data.subs.push(newUser)

	fs.writeFileSync('tempdb.json', JSON.stringify(data, null, 2), 'utf8')
}