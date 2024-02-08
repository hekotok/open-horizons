import Calendar from 'telegram-bot-calendar'

import { bot } from '../../config.js'
import { getUserMessage } from '../utils.js'

export const checkTime = times => {
	if (!Array.isArray(times))
		return 'Кажется что-то пошло не так, попробуйте еще раз'
	if (!times.length)
		return 'Похоже вы не ввели время, попробуйте еще раз'
	for (let timeIdx = 0; timeIdx < times.length; timeIdx++) {
		const [ hours, minutes ] = times[timeIdx].split`:`
		if (hours > 23 || hours < 0 || minutes < 0 || minutes > 59 || !times[timeIdx].includes(':'))
			return `Вы ввели некорректное время. в 24-часовом формате не существует времени ${times[timeIdx]}`
	}

	return null
}

export const sortTime = timeArray => [ ...timeArray ].sort((time1, time2) => {
	const [ hours1, minutes1 ] = time1.split`:`.map(Number)
	const [ hours2, minutes2 ] = time2.split`:`.map(Number)

	return hours1 === hours2 ? minutes1 - minutes2 : hours1 - hours2
})

const checkDate = date => {
	const parts = date.split`.`

	return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00.000Z`) <= new Date()
}

export const getDate = async chatId => {
	let currDate = Date.now()
	const ONE_MONTH = 2_592_000_000

	await bot.sendMessage(chatId, 'Когда пройдет ваше мероприятие?', { reply_markup: Calendar.getUI(currDate) })

	return new Promise(resolve => {
		const handleCallbackQuery = async ({ message, data }) => {
			const messageId = message.message_id

			if (data.startsWith('clndr-date-')) {
				const selectedDate = data.split`-`[2]

				if (checkDate(selectedDate))
					await bot.sendMessage(chatId, 'Извините, но нельзя запланировать мероприятие на прошлое')
				else {
					await bot.deleteMessage(chatId, messageId)
					bot.off('callback_query', handleCallbackQuery)

					resolve(selectedDate)
				}
			}

			(data.startsWith('clndr-nxtMnth') || data.startsWith('clndr-prvMnth')) && await bot.editMessageReplyMarkup(
				Calendar.getUI(currDate += (data.startsWith('clndr-nxtMnth-') ? ONE_MONTH : -ONE_MONTH)),
				{ chat_id: chatId, message_id: messageId }
			)
		}

		bot.on('callback_query', handleCallbackQuery)
	})
}

export const getTime = async chatId => {
	let time = []
	let question = 'Через запятую введите время, в которое вы хотели бы отправлять уведомления\nНапример:\n10:00, 12:00, 13:30, 15:45'

	while (question) {
		time = (await getUserMessage(chatId, true, { question, cancelMessage: 'Добавление мероприятия отменено' }))
			.replace(/\s/g, '').split`,`

		if (!time.length)
			return

		question = checkTime(time)
	}

	return sortTime(time)
}