const app = new $fgta5.Application('mainapp')
const urlDir = 'public/modules/generator'
const Crsl = new $fgta5.SectionCarousell(app.Nodes.Main) 

export default {
	moduleName: 'generator',
	app: app,
	urlDir: urlDir,
	Crsl: Crsl,
	Sections: {
		generatorList: 'generatorList-section',
		generatorEdit: 'generatorEdit-section'
	}
}