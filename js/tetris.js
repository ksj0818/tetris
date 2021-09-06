import BLOCKS from './blocks.js';

// DOM
const playground = document.querySelector(".playground > ul");
const gameText = document.querySelector(".game-text");
const scoreDisplay = document.querySelector(".score");
const restartButton = document.querySelector(".game-text > button");

// Setting
const GAME_ROWS = 20;
const GAME_COLS = 10;

// Variables
let score = 0;
let duration = 500; // 떨어지는 시간
let downInterval;
let tempMovingItem; // 무빙아이템을 사용하기 전에 잠깐 담아두는 용도

const movingItem = {
  type: "",
  direction: 0,    // 화살표를 위로 눌렀을때 블럭들을 회전시키는 역할
  top: 0,          // 어디까지 내려와 있는지 내려가야 하는지 지표를 표현
  left: 0,         // 좌우 값을 알려주는
};

init();

// Functions 
function init() {
  tempMovingItem = {...movingItem}; // 스프레드 오퍼레이터를 사용하면 값만 가져와서 넣음

  for (let i = 0; i < GAME_ROWS; i++) {
    prependNewLine();
  }
  generateNewBlock();
}

function prependNewLine() {
  const li = document.createElement('li');
  const ul = document.createElement('ul');

  for(let j = 0; j < GAME_COLS; j++) {
    const matrix = document.createElement('li');
    ul.prepend(matrix);
  }

  li.prepend(ul);
  playground.prepend(li);
}

function renderBlocks(moveType = "") {
  const {type, direction, top, left} = tempMovingItem;
  const movingBlocks = document.querySelectorAll('.moving');
  movingBlocks.forEach(moving => {
    moving.classList.remove(type, 'moving');
  })


  BLOCKS[type][direction].some(block => {  // forEach는 중간에 멈출 수 없기 때문에 some을 사용
    const x = block[0] + left; // li의 column값이 됨
    const y = block[1] + top; // li의 row값이 됨
    const target = playground.childNodes[y] ? playground.childNodes[y].childNodes[0].childNodes[x] : null; // childNodes 배열처럼 forEach나 sum 같은 배열 함수를 사용할 수 있는 형태로 반환
    const isAvailable = checkEmpty(target);
    
    if (isAvailable) {
      target.classList.add(type, "moving");
    } else {
      tempMovingItem = {... movingItem} // 원상 복귀
      if (moveType === 'retry') {
        clearInterval(downInterval);
        showGameoverText();
      }
      setTimeout(() => {  // setTimeout을 하게 되면 이벤트 루프의 예약된 이벤트들이 다 실행된 후에 그 다음에 스택에 다시 집어넣기 때문에 0초를 주더라도 이게 다 실행이 되고나서 renderBlocks()를 이벤트 스택이 넘쳐버리는 그런것을 방지할 수있다.
        renderBlocks('retry'); // 재귀함수
        if (moveType === 'top') {   // 블럭이 더 이상 내려갈 곳이 없으면 블럭을 고정
          seizeBlock();
        } 
      }, 0)
      return true;
    }
  })
  movingItem.left = left;
  movingItem.top = top;
  movingItem.direction = direction;
}

function showGameoverText() {
  gameText.style.display = "flex";
}

function dropBlock() {
  clearInterval(downInterval);  
  downInterval = setInterval(() => {
    moveBlock('top', 1);
  }, 10)
}

function generateNewBlock() {
  
  clearInterval(downInterval);
  downInterval = setInterval(() => {
    moveBlock('top', 1);
  }, duration)

  const blockArray = Object.entries(BLOCKS);
  const randomIndex = Math.floor(Math.random() * blockArray.length);

  movingItem.type = blockArray[randomIndex][0];
  movingItem.top = 0;
  movingItem.left = 3;
  movingItem.direction = 0;
  tempMovingItem = {...movingItem};
  renderBlocks();
}

function changeDirection() {
  const direction = tempMovingItem.direction;
  direction === 3 ? tempMovingItem.direction = 0 : tempMovingItem.direction += 1;
  renderBlocks();
}

function seizeBlock() {
  const movingBlocks = document.querySelectorAll('.moving');
  movingBlocks.forEach(moving => {
    moving.classList.remove('moving');  
    moving.classList.add('seized');  
  })
  checkMatch();
}

function checkMatch() {
  const childNodes = playground.childNodes;
  childNodes.forEach(child => {
    let matched = true;
    child.children[0].childNodes.forEach(li => {
      if (!li.classList.contains('seized')) {
        matched = false;
      }
    })
    if (matched) {
      child.remove();
      prependNewLine();
      score++;
      scoreDisplay.innerText = score;
    }
  })

  generateNewBlock();
}

function checkEmpty(target) {
  if (!target || target.classList.contains('seized')) { // contains()는 클래스를 포함하고 있는지 없는지 확인해주는 메서드
    return false;
  }
  return true;
}

function moveBlock(moveType, amount) {
  tempMovingItem[moveType] += amount;
  renderBlocks(moveType);
}

// event handling
document.addEventListener('keydown', e=>{ // keydown 이벤트가 벌어질 때 이벤트 객체를 인자로 넘겨 받기
  switch (e.keyCode) {
    case 39:    // 우 방향키
      moveBlock('left', 1);
      break;
    case 37:    // 좌 방향키
      moveBlock('left', -1);
      break;
    case 40:    // 아래 방향키
      moveBlock('top', 1);
      break;
    case 38:    // 위 방향키 
      changeDirection();
      break;
    case 32:    // 스페이스바
      dropBlock();
      break;
    default: 
      break;
  }
})

restartButton.addEventListener("click", () => {
  playground.innerHTML = "";
  gameText.style.display = "none";
  score = 0;
  init();
})