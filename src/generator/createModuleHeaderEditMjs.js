import { kebabToCamel, isFileExist, getSectionData } from './helper.js'
import { fileURLToPath } from 'url';
import path from 'path'
import fs from 'fs/promises'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createModuleHeaderEditMjs(context, options) {
	const overwrite = options.overwrite===true
	const moduleName = context.moduleName
	
	const actions = context.actions
	const sectionPart = 'edit'
	const timeGenerated = context.timeGenerated

	try {


		const headerEntityData = context.entities['header']
		const title = headerEntityData.title

		// Data Detil
		const entitiesDetil = []
		for (let entityName in context.entities) {
			const entity = context.entities[entityName]

			// hanya proses yang detil
			if (entityName=='header') {
				continue
			}

			const e = {
				name: entityName,
				table: entity.table,
				pk: entity.pk,
				moduleSection:  kebabToCamel(`${moduleName}-${entityName}`),
			}
			entitiesDetil.push(e)
		}



		// Data Header
		for (let entityName in context.entities) {
			const entityData = context.entities[entityName]

			// hanya proses yang Header
			if (entityName!='header') {
				continue
			} 

			const sectionName = entityName
			const modulePart = kebabToCamel(`${moduleName}-${sectionName}-${sectionPart}`)
			const targetFile = path.join(context.moduleDir, `${modulePart}.mjs`)

			// cek dulu apakah file ada
			var fileExists = await isFileExist(targetFile)
			if (fileExists && !overwrite) {
				context.postMessage({message: `skip file: '${targetFile}`})
				return
			}

			// reporting progress to parent process
			context.postMessage({message: `generating file: '${targetFile}`})


			// start geneate program code
			
			const tablename = entityData.table
			const headerPrimaryKey = entityData.pk

			const fields = []
			const fieldHandles = []
			const defaultInits = []
			const uploadFields = []
			const comboboxList = []
			let headerHasUpload = false
			for (var fieldName in entityData.Items) {
				const item = entityData.Items[fieldName]

				if (!item.showInForm) {
					continue
				}


				const component = item.component
				const fieldname = item.data_fieldname
				const inputname = item.input_name
				const elementId = `${modulePart}-${item.input_name}`



				if (component=='Filebox') {
					headerHasUpload = true
					uploadFields.push({
						elementId,
						fieldname,
						inputname
					})

				} else if (component=='Combobox') {
					comboboxList.push({
						inputname
					})
				}

				// setup handles
				const handles = []
				for (let eventname in item.Handle) {
					let createhandle = item.Handle[eventname]
					if (createhandle) {
						if (eventname=='selecting' && component=='Combobox') {
							handles.push({
								eventname,
								appId: item.Reference.loaderApiModule,
								path: item.Reference.loaderApiPath,
								field_value: item.Reference.bindingValue,
								field_text: item.Reference.bindingText, 
							})
						} else {
							handles.push({eventname})
						}
					}
				}

				if (handles.length>0) {
					fieldHandles.push({component, inputname, handles})
				}


				// setup default values
				let setdefault
				if (item.data_defaultvalue != '') {
					if (item.component=='Datepicker' || item.component=='Timepicker') {
						setdefault = `${item.name }: new Date()`
					} else if (item.component=='Numberbox') {
						setdefault = `${item.name }: ${item.data_defaultvalue}`
					} else if (item.component=='Checkbox') {
						if (item.data_defaultvalue==='true' || item.data_defaultvalue==='checked' || item.data_defaultvalue==='1') {
							setdefault = `${item.name }: true`
						}
					} else {
						setdefault = `${item.name }: '${item.data_defaultvalue}'`
					}
				}

				if (setdefault!=null) {
					defaultInits.push(setdefault)
				}





				// add to field config data	
				fields.push({  
					component,
					fieldname,
					inputname,
					elementId
				})
			}

		
			// ambil data actions
			const actionList = []
			for (let action of context.actions) {
				const buttonName = kebabToCamel(`btn_action-${action.name}`)
				const elid = `${modulePart}-${buttonName}`
				action.buttonName = buttonName
				action.elementId = elid
				actionList.push(action)
			}


			const allowFormNew = entityData.allowFormNew
			const allowFormEdit = entityData.allowFormEdit


			const variables = {
				timeGenerated,
				moduleDescription: context.descr,
				title,
				tablename,
				allowFormNew,
				allowFormEdit,
				modulePart,
				moduleName,
				moduleSection:  kebabToCamel(`${moduleName}-${sectionName}`),
				moduleList: kebabToCamel(`${moduleName}-${sectionName}-list`),
				fields,
				fieldHandles,
				defaultInits,
				headerPrimaryKey,
				headerHasUpload,
				entitiesDetil,
				uploadFields,
				comboboxList,
				actionList
			}

			
			
			const tplFilePath = path.join(__dirname, 'templates', 'moduleHeaderEdit.mjs.ejs')
			const template = await fs.readFile(tplFilePath, 'utf-8');
			const content = ejs.render(template, variables)
					
			await fs.writeFile(targetFile, content, 'utf8');

		}

	} catch (err) {
		throw err
	}

}