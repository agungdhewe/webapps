const Context = {}
const btn_login = document.getElementById('btn_login')
const obj_username = document.getElementById('obj_username')
const obj_password = document.getElementById('obj_password')



export default class extends Module {
	constructor() {
		super()
	}

	async main(args={}) {
		
		console.log('initializing module...')

		sessionStorage.removeItem('nextmodule');
		btn_login.addEventListener('click', (evt)=>{
			btn_login_click(self, evt)
		})

		setInterval(()=>{
			// cek login, apakah sudah login
			// console.log('test', Math.random())
			const login = sessionStorage.getItem('login');
			if (login) {
				const nexturl = sessionStorage.getItem('login_nexturl');
				location.href = nexturl
			}
		}, 500)	

	}

}



async function btn_login_click(self, evt) {
	console.log('login')
	const username = obj_username.value
	const password = obj_password.value
	
	const queryString = window.location.search
	const params = new URLSearchParams(queryString)
	const nexturl = params.get('nexturl')
	const nextmodule = params.get('nextmodule')

	console.log(nexturl, nextmodule)

	let mask = $fgta5.Modal.createMask()
	try {
		// login, tidak pakai self.apiCall, karena akan bypass session
		const apiLogin = new $fgta5.ApiEndpoint('login/do-login')
		const result = await apiLogin.execute({username, password})
		if (result!=null) {
			// login berhasil
			if (nextmodule!=null) {
				sessionStorage.setItem('nextmodule', nextmodule);
			}

			if (nexturl!=null) {
				// redirect ke next url
				sessionStorage.setItem('login_nexturl', nexturl);
				sessionStorage.setItem('login', true);
				location.href = nexturl
			} else {
				location.href = '/'
			}
		} else {
			// login gagal
			$fgta5.MessageBox.error('Login salah!')
		}

	} catch (err) {
		console.log(err)
		$fgta5.MessageBox.error(err.message)
	} finally {
		mask.close()
		mask = null
	}
}