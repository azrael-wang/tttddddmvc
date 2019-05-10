(function (window) {
	// 'use strict';//目前驾驭不了严格模式有空尽量看一看
	// Your starting point. Enjoy the ride!
	//ajax原理
	// var xhr = new XMLHttpRequest()
	// 	xhr.open('get','http://localhost:8080/todos/getDataAll')
	// 	xhr.send()
	// 	xhr.onreadystatechange = function(){
	// 		if(xhr.readyState === 4 && xhr.status === 200){
	// 			console.log(xhr.responseText)
	// 		}
	// }
	//模版引擎通过原理获取模版引擎内部的内容去覆盖，想要修饰的内容。也就是说模版引擎解决了内容的问题，往哪里放随你咯。
	axios.defaults.baseURL = "http://localhost:8080/todos/"
	getListDetail()
	function getListDetail() {
		axios({
			url: 'getDataAll'
		}).then(res => {
			const { data, meta } = res.data
			if (meta.code === 200) {
				//渲染页面
				// console.log(data)
				//判断hash变化在渲染页面之前控制数据
				//通过window.location可以获取有关网页url相关的信息
				const url = window.location.hash
				const active = data.filter(item => { return item.isFinish === '0' })
				const completed = data.filter(item => { return item.isFinish === '1' })
				switch (url) {
					case "":
					case '#/': renderPage(data, total = data, url)
						break
					case '#/active': renderPage(active, data, url)
						break
					case '#/completed': renderPage(completed, data, url)
						break
				}
			}
		})
	}
	//使用total判断footer的隐藏，但是#/的情况下也需要穿入参数判断，所以给其默认值为temporarily。
	function renderPage(temporarily, total, url) {
		const todos = document.querySelector('.todoapp');
		const noFinish = total.filter(item => { return item.isFinish === '0' }).length
		const isFinish = total.filter(item => { return item.isFinish === '1' }).length
		const html = template('tpl-todos', { list: temporarily, total, noFinish, isFinish })
		todos.innerHTML = html
		//在页面加载之后运行添加一个todo函数是不行的因为它获取的是页面原有的元素，而并不是由模版引擎渲染之后的页面元素。
		addTodo()
		delTodo()
		modify()
		showEdit(temporarily)
		delCompleted(temporarily)
		selectAll(temporarily)
		// changeAll(data)
		footerChange(url)
	}
	//添加一个todo
	function addTodo() {
		//js中事件是元素的一个属性
		//  document.querySelector('.new-todo').onkeyup= function (e){
		// 	 console.log(e)
		//  }
		const addTodo = document.querySelector('.new-todo')
		addTodo.addEventListener('keyup', (e) => {
			//此处因为使用箭头函数所以this指向window，我们用元素本身代替也没问题的
			if (e.keyCode === 13 && addTodo.value.trim() !== '') {
				let data = {
					content: addTodo.value.trim(),  // 必须携带，新增 todo 的内容
					isFinish: 0      // 必须携带，新增 todo 的状态
				}
				axios.post('addTodo', data).then(res => {
					const { meta } = res.data
					if (meta.code === 201) {
						getListDetail()
					}

				})
			}
		})
	}
	//footer角标切换
	function footerChange(url) {
		const arr = document.querySelectorAll('.filters li > a  ')
		if (arr.length === 0) return
		arr.forEach(item => { item.classList.remove('selected') })
		switch (url) {
			case '':
			case '#/': arr[0].classList.add('selected')
				break
			case '#/active': arr[1].classList.add('selected')
				break
			case "#/completed": arr[2].classList.add('selected')
		}
	}
	//删除一个todo
	function delTodo() {
		const delTodo = document.querySelectorAll('.destroy')
		//  console.log(delTodo)
		delTodo.forEach(function (item) {
			item.addEventListener('click', function (e) {
				const id = this.dataset.id
				if (confirm('确定要删除？')) {
					axios.delete(`delTodo?id=${id}`).then(res => {
						const { meta } = res.data
						if (meta.code === 202) {
							getListDetail()
						}
					})
				}
			})
		})
	}
	//修改单条状态
	function modify() {
		const toggle = document.querySelectorAll('.toggle')
		toggle.forEach(item => {
			item.addEventListener('change', function () {
				const data = {
					id: this.dataset.id,
					isFinish: this.checked ? '1' : '0'
				}
				axios.put('changeStatu', data).then(res => {
					const { meta } = res.data
					if (meta.code === 203) {
						getListDetail()
					}
				})
			})
		})
	}
	//编辑一条todo
	function showEdit(data) {
		const lis = document.querySelectorAll('.todo-list li')
		//显示编辑栏
		lis.forEach((item, index) => {
			item.addEventListener('dblclick', function () {
				lis.forEach(item => {
					item.classList.remove('editing')
				})
				this.classList.add('editing')
				edit(index, data[index], item)
			})
		})
	}
	//为了拿到删除的todo我们通过回调函数的方式传递参数
	//编辑操作
	function edit(index, data, todo) {
		const edit = document.querySelectorAll('.edit')[index]
		edit.focus()
		edit.value = data.content
		const id = todo.dataset.id
		edit.addEventListener('keyup', function (e) {
			if (e.keyCode === 13) {
				const value = {
					content: this.value,
					id
				}
				//如果修改后为空，删除此todo
				if (!this.value) {
					axios.delete(`delTodo?id=${id}`).then(res => {
						const { meta } = res.data
						if (meta.code === 202) {
							getListDetail()
						}
					})
					return
				}
				//修改后数据相同取消编辑样式
				if (this.value === data.content) {
					todo.classList.remove('editing')
					return
				}
				//和原数据不同时发起修改请求
				axios.put('changeContent', value).then(res => {
					const { meta } = res.data
					if (meta.code === 203) {
						getListDetail()
					}
				})
			}
		})
	}
	//删除所有已经完成的todo
	function delCompleted(data) {
		const completed = document.querySelector('.clear-completed')
		if (!completed) return
		const arr = []
		data.filter(item => {
			if (item.isFinish === '1') {
				arr.push(item.id)
			}
		})
		completed.addEventListener('click', function (e) {
			axios.delete(`/delAll?id=${arr.toString()}`).then(res => {
				const { meta } = res.data
				if (meta.code === 202) {
					getListDetail()
				}
			})
		})
	}
	//全选按钮
	function selectAll(data) {
		const toggle_all = document.querySelector('.toggle-all')
		toggle_all.addEventListener('click', function (e) {
			// console.log(this.checked)
			const noFinish = data.filter(item => { return item.isFinish === "0" }).length
			const isFinish = data.filter(item => { return item.isFinish === "1" }).length
			if (isFinish === data.length) {
				getSelAll(false)
				return
			}
			if (noFinish <= data.length) {
				getSelAll(true)
				return
			}
		})
	}
	//请求函数
	function getSelAll(bool) {
		axios.get(`changeStatusAll?isFinish=${bool}`).then(res => {
			const { meta } = res.data
			if (meta.code === 203) {
				getListDetail()
			}
		})
	}
	//通过change事件改变全选按钮
	// function changeAll(data){
	// 	const toggle_all = document.querySelector('#toggle-all')
	// 	toggle_all.addEventListener('change',function(){
	// 		//  const  bool = this.checked
	// 		 console.log(this.checked)
	// 		axios.get(`changeStatusAll?isFinish=false`).then(res => {
	// 			const { meta } = res.data
	// 			if (meta.code === 203) {
	// 				getListDetail()
	// 			}
	// 		})
	// 	})
	// }
	//监听一个hashchange改变事件 给window添加一个hashchange事件
	window.addEventListener('hashchange', (e) => {
		getListDetail()
	})
})(window);
