import Calendar from 'telegram-bot-calendar'

import { bot } from '../../config.js'
import { getUserMessage } from '../utils.js'

const checkTime = time => {
	if (time.length > 5 || !time.includes(':'))
		return 'Кажется что-то пошло не так, попробуйте еще раз'
	if (!time.length)
		return 'Похоже вы не ввели время, попробуйте еще раз'

	const [ hours, minutes ] = time.split`:`
	if (+hours > 23 || +hours < 0 || +minutes < 0 || +minutes > 59)
		return `Вы ввели некорректное время. в 24-часовом формате не существует времени ${time}`

	return null
}

export const delayDate = date => date - Date.now() - 10_800_000

export const checkPastDate = (date, time = '23:59') => delayDate(parseDateTime(date, time)) > 0

export const parseDateTime = (dateString, timeString) => {
	const [ day, month, year ] = dateString.split`.`
	const [ hours, minutes ] = timeString.split`:`

	return new Date(`${year}-${month}-${day}T${hours}:${minutes}:00.000Z`)
}

export const getDate = async (chatId, question = 'Когда пройдет ваше мероприятие?') => {
	let currDate = Date.now()
	const ONE_MONTH = 2_592_000_000

	await bot.sendMessage(chatId, question, { reply_markup: Calendar.getUI(currDate) })

	return new Promise(resolve => {
		const handleCallbackQuery = async ({ message, data }) => {
			const messageId = message.message_id

			if (data.startsWith('clndr-date-')) {
				const selectedDate = data.split`-`[2]

				if (!checkPastDate(selectedDate))
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

export const getTime = async (chatId, question = 'Введите время, в которое вы хотели бы отправлять уведомление\nНапример:\n10:00') => {
	let time

	time = (await getUserMessage(chatId, true, { question, cancelMessage: 'Добавление мероприятия отменено' })).replace(/\s/g, '')
	question = checkTime(time)

	return question ? getTime(chatId, question) : time
}