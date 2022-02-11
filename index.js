window.addEventListener('load', function () {
    function Mine(tr, td, mineNum) {
        this.tr = tr;   // 行数
        this.td = td;   // 列数
        this.mineNum = mineNum;     // 雷数  (0-9)

        this.squares = [];  //存储所有单元格的信息(类型，坐标，值)，作为二维数组，按行和列的顺序排放
        this.tds = [];  //存储所有单元格的td对象
        this.restMineNum = mineNum + 1; //剩余雷的数量 (1-10)
        this.allRight = false;  //用户标记的小红旗后面是否全是雷

        this.gameBox = document.querySelector('.gameBox');
    }

    // Mine的成员方法
    Mine.prototype.createRandomMine = function () {
        let randomNum = new Array(this.tr * this.td);  // 生成一个有长度的空数组，长度为单元格总数
        for (let i = 0; i < randomNum.length; i++) {
            randomNum[i] = i;
        }
        // 随机排序
        randomNum.sort(function () { return 0.5 - Math.random() });
        // 高级：取前99个随机排好的数据作为雷的索引位置
        return randomNum.slice(0, this.mineNum + 1);
    }

    Mine.prototype.main = function () {
        let randomMines = this.createRandomMine();
        let n = 0;  // 整个gameBox的索引

        for (let i = 0; i < this.tr; i++) {
            this.squares[i] = [];
            for (let j = 0; j < this.td; j++) {
                // 取一个方块在数组里的数据用行和列的方式去取，找方块周围的方块的时候用坐标的形式去取
                // 行和列的形式与坐标形式的x，y值正好相反
                if (randomMines.indexOf(n++) != -1) {
                    this.squares[i][j] = {
                        type: 'mine',
                        x: j,
                        y: i
                    }
                } else {
                    this.squares[i][j] = {
                        type: 'number',
                        x: j,
                        y: i,
                        value: 0
                    }
                }
            }
        }

        // 事件委托：阻止右键菜单
        this.gameBox.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        this.layNumber();
        this.createDom();

        // 剩余雷数动态变化
        this.mineNumDom = document.querySelector('.currentMineNum');
        this.mineNumDom.innerHTML = this.restMineNum;
    }

    Mine.prototype.getAroundLocation = function (squares) {
        let x = squares.x;
        let y = squares.y;
        let location = [];    // 存储某个坐标的四周坐标(排除特殊存在)

        /*
            x-1.y-1  x, y-1  x+1,y-1
            x-1,y    x,y     x+1,y
            x-1,y+1  x,y+1   x+1,y+1
        */

        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                if (i < 0 || j < 0 // 格子坐标超出左边和上边范围
                    || i > this.td - 1 || j > this.td - 1 // 格子坐标超出右边和下边范围
                    || (i == x && j == y) // 当前循环到的格子坐标是自己
                    || this.squares[j][i].type == 'mine' // 周围格子是个雷(此处易错)
                ) {
                    continue;
                }
                location.push([j, i]);    //以行列的形式返回，方便取数据操作
            }
        }

        return location;
    }

    Mine.prototype.layNumber = function () {
        for (let i = 0; i < this.tr; i++) {
            for (let j = 0; j < this.td; j++) {
                // 只在雷的周围放数字
                if (this.squares[i][j].type == 'number') {
                    continue;
                }

                let nums = this.getAroundLocation(this.squares[i][j]);
                for (let k = 0; k < nums.length; k++) {
                    /* 
                        num[k] = [y,x]
                        num[k][0] = ...
                        num[k][1] = ...
                    */
                    this.squares[nums[k][0]][nums[k][1]].value += 1;
                }
            }
        }
    }

    Mine.prototype.createDom = function () {
        let domTable = document.createElement('table');
        for (let i = 0; i < this.tr; i++) {
            let domTr = document.createElement('tr');
            this.tds[i] = []; // 创建单元格的二维数组

            for (let j = 0; j < this.td; j++) {
                let domTd = document.createElement('td');
                let This = this;  // 自定义创建的mine对象

                domTd.pos = [i, j]; // 当前格子对应的行与列数据存入一维数组
                domTd.onmousedown = function (e) {
                    This.playGame(e, this); // td对象
                }

                this.tds[i][j] = domTd;     // 把创建好的所有单元格存进二维数组

                domTr.appendChild(domTd);   // 将td元素尾插进tr元素下
            }
            domTable.appendChild(domTr);
        }
        this.gameBox.innerHTML = '';    // 避免多次点击创建多个表格
        this.gameBox.appendChild(domTable);
    };

    Mine.prototype.playGame = function (e, td) {
        // 事件对象的which方法 =》 1左键 3右键
        if (e.which == 1 && td.className !== 'flags') {
            let curSquare = this.squares[td.pos[0]][td.pos[1]];
            let numberClass = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
            let This = this;

            // 点到数字
            if (curSquare.type == 'number') {
                td.innerHTML = curSquare.value;
                // 设置数字样式
                td.className = numberClass[curSquare.value];

                // value为0的情况：递归
                // 扩展一大片为0区域
                if (curSquare.value == 0) {
                    td.innerHTML = '';
                    /*
                        1、显示自己
                        2、找四周(如果四周值不为0，则显示到这里不再递归了)
                    */
                    function getAllZero(square) {
                        // This => mine对象
                        let aroundLocation = This.getAroundLocation(square);

                        for (let i = 0; i < aroundLocation.length; i++) {
                            let x = aroundLocation[i][0]; // 行
                            let y = aroundLocation[i][1]; // 列

                            This.tds[x][y].className = numberClass[This.squares[x][y].value];

                            if (This.squares[x][y].value == 0) {
                                // 四周某个中心点值为0的情况
                                if (!This.tds[x][y].check) {
                                    // 此判断条件可避免反复在同一个中心点调用该函数
                                    This.tds[x][y].check = true;
                                    // 递归！
                                    getAllZero(This.squares[x][y]);
                                }
                            } else {
                                // 四周某个中心点值不为0的情况
                                This.tds[x][y].innerHTML = This.squares[x][y].value;
                            }
                        }
                    }
                    getAllZero(curSquare);
                }
            } else {
                // 雷
                this.gameOver(td);
            }
        }


        if (e.which == 3) {
            // - 若是个数字，则不可插红旗
            // - 可取消以插好的红旗
            // - 红旗全部插完后，有一个不是雷则游戏失败
            if (td.className && td.className !== 'flags') {
                return;
            }
            td.className = (td.className == 'flags') ? '' : 'flags';

            if (this.squares[td.pos[0]][td.pos[1]].type == 'mine') {
                this.allRight = true;  // 
            } else {
                this.allRight = false;
            }

            if (td.className == 'flags') {
                this.mineNumDom.innerHTML = --this.restMineNum;
            } else {
                this.mineNumDom.innerHTML = ++this.restMineNum;
            }

            if (this.restMineNum == 0) {
                if (this.allRight) {
                    alert('恭喜您！游戏通关');
                } else {
                    alert('游戏失败！请重新开始');
                    this.gameOver();
                }
            }
        }
    }

    Mine.prototype.gameOver = function (clickMine) {
        // - 显示所有雷
        // - 取消所有格子的点击事件
        // - 给点中的那个雷单元格标红
        for (let i = 0; i < this.tr; i++) {
            for (let j = 0; j < this.td; j++) {
                // 显示所有的雷单元格
                if (this.squares[i][j].type == 'mine') {
                    this.tds[i][j].className = 'mines';
                }

                this.tds[i][j].onmousedown = null;
            }
        }

        if (clickMine) {
            clickMine.style.backgroundColor = 'red';
        }
    }

    // 切换游戏难度功能
    let btns = document.querySelectorAll('button');
    let mine = null; // 存储实例对象
    let ln = 0;
    let arr = [[9, 9, 9], [16, 16, 39], [28, 28, 99]];

    for (let i = 0; i < btns.length - 1; i++) {
        btns[i].onclick = function () {
            btns[ln].className = ''
            btns[i].className = 'active';

            // ...遍历二维数组运算符
            mine = new Mine(...arr[i]);
            mine.main();

            ln = i;
        }
    }
    btns[0].onclick();
    btns[3].onclick = function () {
        mine.main();
    }
})