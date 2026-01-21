let intervalId;
let listArray = [];
let listIndex = 0;
let uniqueId = 0;
let totalSeconds = 0;
let totalTime = 0;
let todoData = [];
let isTimerStop = true;

$(function(){	
	loadFromStorage();
	$('#todoTitle').on('keydown',function(e){
		if(e.keyCode == 13){ //제목에 엔터 시에도 todoSubmit되도록 처리
			todoSubmit();
		}
	});
	$('#filterOption').on('change',function(){
		let filterOption = $(this).val();
		if(filterOption === 'title') {
			$('#filterDue').hide().val('');
			$('#filterTitle').show();
		} else {
			$('#filterTitle').hide().val('');
			$('#filterDue').show();
		}

		filterTodos();
	});

	$('#filterTitle').on('keyup',function(){
		filterTodos();
	});

	$('#filterDue').on('change',function(){
		filterTodos();
	});
});			

$(document).on('click',':checkbox',function(){
	const $li = $(this).parents('li');

	if($(this).is(':checked')) {
		$li.addClass('complete');
		
	} else {
		$li.removeClass('complete');
	}
	reorderList(); //재정렬
});

function todoSubmit(){
	const titleValue = $('#todoTitle').val();
	const dueValue = $('#todoDue').val();
	let dueObject = ''; //undefined 방지

	if(!titleValue) { //title 체크 먼저, 없을 경우 등록 방지
		alert('제목을 입력해주세요.');
		return false;
	}

	if(checkDuplication(titleValue,dueValue) > 0) { //중복 등록을 방지한다
		alert('같은 내용을 연속으로 등록할 수 없습니다.');
		return false;
	}

	if(dueValue) { //기한이 있다면 기한을 추가한다
		dueObject = `<span class="dateLabel">기한</span><span class="date">${dueValue}</span>`;
	}

	$('#todoList').append(`<li data-index="${listIndex}" data-id="${uniqueId}"><input type="checkbox" value="1"> <span class="title">${titleValue}</span> ${dueObject}<button type="button" onclick="deleteList(${uniqueId})" class="caution"><i class="fa-solid fa-trash"></i></button></li>`);
	listArray.push(uniqueId);

	$('#todoTitle').val('');
	$('#todoDue').val('');
	reorderList();

	uniqueId++;
	listIndex++;
	
	$('#todoTitle').focus();
}

function todoReset(){
  if (confirm('리스트를 초기화하시겠습니까?')) {
	listArray = [];
	listIndex = 0;
	uniqueId = 0;

    $('#todoList').empty();	
	todoSubmitStorage();
  }		
}

function checkDuplication(titleValue,dueValue) {
	let countTodo = 0;

	$('ul#todoList').find('li').each(function(){ //기존에 있는지 확인
		if($(this).find('.title').text() == titleValue && $(this).find('.date').text().indexOf(dueValue) != -1) {
			countTodo++;
		}
	});

	return countTodo;
}

function deleteList(uniqueId) {

  if (!confirm('정말 삭제하시겠습니까?')) {
	  return false;
  }	

  else{

	const $this = $(`li[data-id="${uniqueId}"]`);
	const arrayIndex = listArray.indexOf(Number($this.attr('data-id')));


	$this.remove();

	listArray.splice(arrayIndex, 1);
	  
	resetListCount();
	reorderList();
  }
}

function resetListCount(){
	listIndex = Number($('ul#todoList').find('li').length);
}

function reorderList(){
	listArray.forEach(function(element,index) {
		$(`li[data-id="${element}"]`).attr('data-index',index);
	});
	
		const $unchecked = $('li[data-id] input:not(:checked)').parent().toArray();
		  $unchecked.sort(function(a, b) {
			return $(a).attr('data-index') - $(b).attr('data-index');
		  });

		const $checked = $('li[data-id] input:checked').parent();
		
		$('#todoList').empty().append($unchecked).append($checked);
		organizeIndex();
		todoSubmitStorage();
}

function organizeIndex(){
	$(`li[data-index]`).each(function(index){
		$(this).attr('data-index',index);
	});
}

function todoSubmitStorage(){
	todoData = [];

	if(!$(`li[data-id]`).length) {
		localStorage.setItem('todos', JSON.stringify(todoData));
		return;
	}

	$(`li[data-id]`).each(function(){
		const listId = $(this).attr('data-id');
		const todoIndex = $(this).attr('data-index');
		const titleValue = $(this).find('.title').text();
		const dueValue = $(this).find('.date').text();

		let todoDone = 0;
		if($(this).find('input:checked').length > 0) {
			todoDone = 1;
		} else {
			todoDone = 0;
		}

	  let todoObj = {
		id: listId,
		title: titleValue,
		due: dueValue,
		done: todoDone,
		index: todoIndex
	  };
		todoData.push(todoObj);		
	});	

	localStorage.setItem('todos', JSON.stringify(todoData));

}

function loadFromStorage(){
	totalSeconds = Number(localStorage.getItem('timerCurrent')) || 0;
	totalTime = Number(localStorage.getItem('totalTime')) || 0;

	clockWork(totalSeconds,'#timerCount');
	clockWork(totalTime,'#totalWork');	

	let isSaved = localStorage.getItem('todos');
	let checkingChecked = 0;

	if(!isSaved) { return; }
	else {
	todoData = JSON.parse(localStorage.getItem('todos'));
	todoData.forEach(function(element,index) {
		let dueObject = '';
		let isChecked = '';
		let checkedClass = '';
		const loadId = element.id;
		const loadTitle = element.title; 
		const loadDue = element.due; 
		const loadDone = element.done; 
		const loadIndex = element.index;

		listArray.push(Number(element.id));

		if(Number(loadDone) == 1){
			isChecked = 'checked';
			checkedClass = 'class="complete"';
			checkingChecked++;
		} else {
			isChecked = '';
			checkedClass = '';
		}

		if(loadDue) { //기한이 있다면 기한을 추가한다
			dueObject = `<span class="dateLabel">기한</span><span class="date">${loadDue}</span>`;
		}
		
		const $li = `<li data-index="${loadIndex}" data-id="${loadId}" ${checkedClass}><input type="checkbox" value="1" ${isChecked}> <span class="title">${loadTitle}</span> ${dueObject}<button type="button" onclick="deleteList(${loadId})" class="caution"><i class="fa-solid fa-trash"></i></button></li>`
		$('#todoList').append($li);
	});

	listArray.sort(function(a, b) {
	  return a - b;
	});
	uniqueId = listArray.length > 0 ? Math.max(...listArray) + 1 : 0;
	//마이너스 inifinity 오류로 listArray 숫자 셈
	listIndex = todoData.length > 0 ? todoData.length : 0;

	$('#completeCount').text(`${checkingChecked} / ${listIndex}`);

	}
}

function startTimer() {

   if (!isTimerStop) { //중복 실행을 방지
		return;
   }
	isTimerStop = false;
	intervalId = setInterval(function() {
	totalSeconds++;
	totalTime++;
    localStorage.setItem('timerCurrent', totalSeconds);
    localStorage.setItem('totalTime', totalTime);
	clockWork(totalSeconds,'#timerCount');
	},1000);
}



function clockWork(time,element) {
  let hours = Math.floor(time / 3600);
  let minutes = Math.floor((time % 3600) / 60);
  let seconds = time % 60;
  
  let display = String(hours).padStart(2, '0') + ':' +
                String(minutes).padStart(2, '0') + ':' +
                String(seconds).padStart(2, '0');
  
  $(element).text(display);
}

function pauseTimer(){
	isTimerStop = true;	
	clearInterval(intervalId);
}

function stopTimer(){
	isTimerStop = true;
	clearInterval(intervalId);
	totalSeconds = 0;
	localStorage.setItem('timerCurrent',0);
	clockWork(totalSeconds,'#timerCount');
}

function resetTimer(){
	totalSeconds = 0;
	localStorage.setItem('timerCurrent',0);
	if(isTimerStop) {
		clockWork(totalSeconds,'#timerCount');
	}
}

function filterTodos(){
	let filterOption = $('#filterOption').val();
	let keyword;

	if(filterOption === 'title') {
		keyword = $('#filterTitle').val().toLowerCase();
	} else {
		keyword = $('#filterDue').val();
	}

   if(!keyword) {
	   $('ul#todoList').find('li').show();
       return;
   }

   $('ul#todoList').find('li').each(function(){
	const $li = $(this);
	let isMatch = false;


	if(filterOption === 'title') {
		const title = $li.find('.title').text().toLowerCase();
		isMatch = title.includes(keyword);
	} else {
		const due = $li.find('.date').text();
		isMatch = due.includes(keyword);
	}

	$li.toggle(isMatch);
   });
}

function calculateStats() {
	let completeTodos = $('ul#todoList').find(':checkbox:checked').length;
	let totalTodos = $('#todoList li').length;
	let totalTodoRatio = `${completeTodos} / ${totalTodos}`;

	$('#completeCount').text(totalTodoRatio);
	clockWork(totalTime,'#totalWork');
}

function resetTotalTime() {
  if (confirm('총 작업시간을 초기화하시겠습니까?')) {
    totalTime = 0;
	localStorage.setItem('totalTime',0);
    clockWork(totalTime, '#totalWork');
  } else {
	  return false;
  }

}