/**
 *
 * @param {初始化游戏的区域的父节点} gameAreaElement
 * @param {游戏方块的行数} line
 * @param {游戏方块的总列数} column
 */
function lightGame(gameAreaElement, line = 5, column = 5) {
    this.main = gameAreaElement; //游戏的区域的父节点
    this.maps = new Array(line); //存储游戏中每个块的dom节点
    this.line = line; //行数
    this.column = column; //列数
    this.allNum = line * column; //总的方块数
    for (let i = 0; i < this.maps.length; i++) {
        this.maps[i] = new Array(column);
    }
    // 深拷贝一个同样大小的数组用来标记
    this.vis = JSON.parse(JSON.stringify(this.maps)); //标记块的状态
    this.isInit = false; //判断游戏是否初始化完成
    this.steps = 0; //游戏已经进行了的步数
    this.clickLock = true; //点击锁，防止同时多次点击
}
lightGame.prototype.build = function () {
    // 初始化css
    let styleElement = document.createElement('style');
    styleElement.innerHTML += '.game-line{\
                                        width: 100%; \
                                        height: ' + 100 / this.line + '%; \
                                    }';
    styleElement.innerHTML += '.game-part{\
                                        width: ' + (100 / this.column - 2) + '%; \
                                        height:90%; \
                                        display: inline-block; \
                                        border-radius: 5px; \
                                        margin:1%;\
                                        cursor: pointer;\
                                        vertical-align: middle;\
                                        transition: background 0.7s;\
                                    }';
    document.head.appendChild(styleElement)
    // 创建游戏的dom块
    this.main.innerHTML = '';
    let THIS = this;
    for (let i = 0; i < this.line; i++) {
        let dom = document.createElement('div');
        dom.setAttribute('class', 'game-line');
        for (let j = 0; j < this.column; j++) {
            this.maps[i][j] = document.createElement('div');
            this.maps[i][j].setAttribute('class', 'game-part');
            this.maps[i][j].addEventListener('click', function () {
                THIS.clicking(i, j, THIS);
            });
            this.maps[i][j].setAttribute('pos-x', i);
            this.maps[i][j].setAttribute('pos-y', j);
            dom.appendChild(this.maps[i][j]);
        }
        this.main.appendChild(dom);
    }
    return this.isInit = true;
}

lightGame.prototype.init = function (settings = {}) {
    if (!this.isInit) return;
    if (typeof (settings) != 'object') return;
    //初始化默认开启的方块
    if (!settings.opened) {
        console.log('init error!');
        return;
    }
    // 替换开启方块函数
    if (settings.openFunction && typeof (settings.openFunction) == 'function') {
        this.openPart = settings.openFunction;
    }
    // 替换关闭方块函数
    if (settings.closeFunction && typeof (settings.closeFunction) == 'function') {
        this.closePart = settings.closeFunction;
    }
    // 替换通关函数
    if (settings.successFunction && typeof (settings.successFunction) == 'function') {
        this.gameSuccess = settings.successFunction;
    }
    // 添加change接口
    if (settings.changeFunction && typeof (settings.changeFunction) == 'function') {
        this.change = settings.changeFunction;
    }
    //对所有的进行关闭
    for (let i = 0; i < this.maps.length; i++) {
        for (let j = 0; j < this.maps[i].length; j++) {
            this.vis[i][j] = false;
            this.closePart(this.maps[i][j]);
        }
    }
    this.steps = 0;
    //对需要开启的方块执行其开启函数
    for (var i = 0; i < settings.opened.length; i++) {
        let nowNum = settings.opened[i];
        if (Math.floor((nowNum - 1) / this.line) >= this.line || (nowNum - 1) % this.line >= this.column) continue;
        this.openPart(this.maps[Math.floor((nowNum - 1) / this.line)][(nowNum - 1) % this.line]);
        this.vis[Math.floor((nowNum - 1) / this.line)][(nowNum - 1) % this.line] = true;
    }
}

lightGame.prototype.clicking = function (line, column, THIS) {
    if (THIS.clickLock) return;
    THIS.clickLock = true;
    THIS.steps++;
    let movx = [0, 0, -1, 1];
    let movy = [1, -1, 0, 0];
    if (THIS.vis[line][column]) {
        // 关闭自己
        THIS.vis[line][column] = false;
        THIS.closePart(THIS.maps[line][column]);

    } else {
        // 开启自己
        THIS.vis[line][column] = true;
        THIS.openPart(THIS.maps[line][column]);
    }
    // 对四周翻转
    for (let i = 0; i < 4; i++) {
        let nowx = line + movx[i];
        let nowy = column + movy[i];
        if (nowx < THIS.line && nowx >= 0 && nowy < THIS.column && nowy >= 0) {
            if (THIS.vis[nowx][nowy]) {
                THIS.vis[nowx][nowy] = false;
                THIS.closePart(THIS.maps[nowx][nowy]);
            } else {
                THIS.vis[nowx][nowy] = true;
                THIS.openPart(THIS.maps[nowx][nowy]);
            }
        }
    }
    // 开始检测是否通关
    let flag = true;
    for (let i = 0; i < THIS.line; i++) {
        for (let j = 0; j < THIS.column; j++) {
            if (THIS.vis[i][j]) {
                // 有一个地方未关闭
                flag = false;
                break;
            }
        }
    }
    if (flag) {
        THIS.gameSuccess();
        THIS.steps = 0;
    } else {
        // 调用change接口
        this.change();

    }
}

lightGame.prototype.gameSuccess = function () {
    alert('恭喜通关！通关所用步数: ' + this.steps);
}
lightGame.prototype.openPart = function (part) {
    part.style.background = '#0ae';
    this.clickLock = false;
}

lightGame.prototype.closePart = function (part) {
    part.style.background = 'rgb(20, 20, 20)';
    this.clickLock = false;
}

