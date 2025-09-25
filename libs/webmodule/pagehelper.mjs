
export async function openSection(self, sectionName, params, fnOpened) {
	const context = params.Context
	const Crsl = context.Crsl
	const section = Crsl.Items[sectionName]
	section.setSectionReturn(params.sectionReturn)
	section.show({}, fnOpened)
} 


export function renderLog(tbody, data) {
	tbody.innerHTML = ''

	for (var row of data) {
		const tr = document.createElement('tr')

		const tdTime = document.createElement('td')
		tdTime.innerHTML = row.log_time
		tdTime.classList.add('logcell')

		const tdUser = document.createElement('td')
		tdUser.innerHTML = row.log_user_name
		tdUser.classList.add('logcell')

		const tdAction = document.createElement('td')
		tdAction.innerHTML = row.log_action
		tdAction.classList.add('logcell')

		const tdIP = document.createElement('td')
		tdIP.innerHTML = row.log_ipaddress
		tdIP.classList.add('logcell')

		const tdRemark = document.createElement('td')
		tdRemark.innerHTML = row.log_remark
		tdRemark.classList.add('logcell')


		tr.appendChild(tdTime)
		tr.appendChild(tdUser)
		tr.appendChild(tdAction)
		tr.appendChild(tdIP)
		tr.appendChild(tdRemark)
		tbody.appendChild(tr)
	}
}