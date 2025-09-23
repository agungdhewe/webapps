
export async function openSection(self, sectionName, params, fnOpened) {
	const context = params.Context
	const Crsl = context.Crsl
	const section = Crsl.Items[sectionName]
	section.setSectionReturn(params.sectionReturn)
	section.show({}, fnOpened)
} 


