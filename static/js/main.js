// 现在的关卡数
let nowCheckPoint = 0;
// 关卡信息的显示区域变量
let checkPointArea;
let stepsArea;
// 储存关卡信息
let gameContent = [];
window.onload = function () {
    // 得到关卡信息DOM元素
    checkPointArea = document.querySelector('#checkpoint>span');
    stepsArea = document.querySelector('#steps>span');
    // 得到进程通信类
    const ipc = require('electron').ipcRenderer;
    // 得到保存的上次的关卡信息
    ipc.send('get-checkpoint');
    ipc.on('get-checkpoint-reply', (event, message) => {
        nowCheckPoint = parseInt(message);
    });
    // 得到游戏的关卡内容
    ipc.send('get-game-content');
    let gameArea = document.querySelector('.game-area');
    const Light = new lightGame(gameArea, 5, 5);
    Light.build();
    ipc.on('game-content-reply', function (event, message) {
        gameContent = message;
        // 初始化游戏
        select(Light, nowCheckPoint, gameContent);
    });

    // 绑定关闭按钮的事件
    let closeButton = document.querySelectorAll('.close');
    for(let i = 0; i < closeButton.length; i ++){
        closeButton[i].addEventListener('click', () => {
            ipc.send('save-game', nowCheckPoint);
            ipc.once('save-finish', () => {
                ipc.send('quit-game');
            });
        });
    }

    // 绑定按钮的最小化事件
    let minimizeButton = document.querySelector('#minimize');
    minimizeButton.addEventListener('click', () => {
        ipc.send('minimize-window');
    });

    // 切换下一关
    let next = document.querySelector('#next');
    next.addEventListener('click', () => {
        select(Light, nowCheckPoint + 1, gameContent);
    });
    // 切换上一关
    let last = document.querySelector('#last');
    last.addEventListener('click', () => {
        select(Light, nowCheckPoint - 1, gameContent);
    });

    // 绑定菜单按钮
    let menuButton = document.querySelector('#menu');
    let clickBlock = false;
    let menuBody = document.querySelector("#menu-body");
    // 蒙版
    let blank = document.createElement('div');
    blank.classList.add('no');
    blank.addEventListener('click', function(){
        if(clickBlock){
            return;
        }
        fadeOut(menuBody, 350, () => {
            this.classList.remove('blank');
            this.classList.add('no');
            menuBody.style.display = "none";
            clickBlock = false;
        });
    });
    document.body.appendChild(blank);
    // 点击出现
    menuButton.addEventListener('click', () => {
        if(clickBlock){
            return;
        }
        if(menuBody.style.display != 'block'){
            clickBlock = true;
            menuBody.style.display = "block";
            fadeIn(menuBody, 350, () => {
                blank.classList.remove('no');
                blank.classList.add('blank');
                clickBlock = false;
            });
        }
        else{
            blank.click();
        }
    });

    // 绑定菜单按钮事件
    let allMenu = document.querySelectorAll('#menu-body>li');
    for(let i = 0; i < allMenu.length; i ++){
        allMenu[i].addEventListener('click', () => {
            blank.click();
        });
    }
    // 关于 按钮
    let aboutButton = document.querySelector("#about");
    aboutButton.addEventListener('click', () => {
        if(clickBlock){
            return;
        }
        // 与主进程通信，创建新的窗口
        ipc.send('create-about-window');
    });
    // 帮助
    let helpButton = document.querySelector('#help');
    helpButton.addEventListener('click', () => {
        alert("目标：消除所有的蓝色块\n规则：点击任意块，会让该块以及四周的块颜色翻转");
    });
    // 关卡跳转
    let jumpButton = document.querySelector('#jump');
    let jumpClickBlock = false;
    jumpButton.addEventListener('click', () => {
        if(jumpClickBlock){
            return;
        }
        jumpClickBlock = true;
        MyPrompt('新的关卡编号!', (num) => {
            if(num == '') num = 1;
            num = this.parseInt(num) - 1;
            select(Light, num, gameContent);
            jumpClickBlock = false;
        });
    });
    // 重新开始按钮
    let restartButton = document.querySelector("#restart");
    restartButton.addEventListener("click", () => {
        if(clickBlock){
            return;
        }
        select(Light, nowCheckPoint, gameContent);
    });
}

function select(light, num, content){
    num = parseInt(num);
    if(num < 0 || num >= content.length) return;
    nowCheckPoint = num;
    light.init({
        "opened" : content[nowCheckPoint],
        "successFunction" : success,
        "changeFunction" : change
    });
    // 改变DOM元素的值
    checkPointArea.innerHTML = nowCheckPoint + 1;
    stepsArea.innerHTML = '0';
}

function success(){
    alert('恭喜通关！通关所用步数: ' + this.steps);
    select(this, nowCheckPoint + 1, gameContent);
}

function change(){
    stepsArea.innerHTML = this.steps;
}

function fadeIn(element, time, fun){
    let now = 0;
    let interval = 20;
    let steps = interval / time;
    function change(){
        element.style.opacity = now;
        now += steps;
        if(now < 1){
            setTimeout(change, interval);
        }
        else{
            if(typeof(fun) == 'function')
                fun();
        }
    }
    setTimeout(change, interval);
}
function fadeOut(element, time, fun){
    let now = 1;
    let interval = 20;
    let steps = interval / time;
    function change(){
        element.style.opacity = now;
        now -= steps;
        if(now > 0){
            setTimeout(change, interval);
        }
        else{
            if(typeof(fun) == 'function')
                fun();
        }
    }
    setTimeout(change, interval);
}

function MyPrompt(title = '', callback){
    let main = document.createElement('div');
    main.style = `
        width:40%;
        height:30%;
        position:fixed;
        top:0px;
        left:0px;
        right:0px;
        bottom:0px;
        background:white;
        border-radius:5px;
        margin: auto;
        background: rgba(31, 35, 38, 0.9);
        display:flex;
        align-items:center;
        justify-content:center;
        flex-wrap:wrap;
    `;
    if(title != ''){
        let titleElem = document.createElement('p');
        titleElem.style = `
            color:white;
            width:100%;
            over-flow:hidden;
            height:20px;
            line-height:20px;
            text-align:center;
        `;
        titleElem.innerHTML = title;
        main.appendChild(titleElem);
    };
    let input = document.createElement('input');
    input.setAttribute('type', 'input');
    input.style = `
        width:90%;
        height:30px;
        flex-basis:90%;
        background:rgb(25, 25, 25);
        color:gray;
        font-size:110%;
        border:none;
    `;
    main.appendChild(input);

    let buttDiv = document.createElement('div');
    let buttFalse = document.createElement('button');
    let buttTrue = document.createElement('button');
    buttFalse.innerHTML = '取消';
    buttFalse.addEventListener('click', () => {
        input.value = '';
        buttTrue.click();
    });
    buttTrue.innerHTML = '确认';
    buttTrue.addEventListener('click', () => {
        if(typeof(callback) == 'function'){
            callback(input.value);
        }
        document.body.removeChild(main);    
    });
    buttTrue.style = "margin-right:10px";
    buttDiv.appendChild(buttTrue);
    buttDiv.appendChild(buttFalse);
    main.appendChild(buttDiv);
    document.body.appendChild(main);
    input.focus();
}