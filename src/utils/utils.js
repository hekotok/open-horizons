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

export const sendNameMessage = async (chatId, text) => {
	await bot.sendMessage(chatId, text
		//.replace(/{first_name}/g, chat.first_name || '')
		//.replace(/{last_name}/g, chat.last_name || '')
	)
}

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

export const addSub = chatId => {
	const data = JSON.parse(fs.readFileSync('tempdb.json', 'utf8'))

	!data.subs && (data.subs = [ chatId ])
	!data.subs.includes(chatId) && data.subs.push(chatId)

	fs.writeFileSync('tempdb.json', JSON.stringify(data, null, 2), 'utf8')
}