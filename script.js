class SudokuCore {
    constructor() {
        this.board = [];
        this.solution = [];
    }

    // 初始化 9x9 空盘
    initEmptyBoard() {
        return Array.from({ length: 9 }, () => Array(9).fill(0));
    }

    // 检查数字放置是否合法
    isValid(board, row, col, num) {
        // 检查行
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }
        // 检查列
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }
        // 检查 3x3 宫格
        let startRow = Math.floor(row / 3) * 3;
        let startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }
        return true;
    }

    // 填充对角线上的 3 个 3x3 宫格 (为了随机性)
    fillDiagonal() {
        for (let i = 0; i < 9; i = i + 3) {
            this.fillBox(i, i);
        }
    }

    fillBox(row, col) {
        let num;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                do {
                    num = Math.floor(Math.random() * 9) + 1;
                } while (!this.isSafeInBox(row, col, num));
                this.board[row + i][col + j] = num;
            }
        }
    }

    isSafeInBox(rowStart, colStart, num) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[rowStart + i][colStart + j] === num) return false;
            }
        }
        return true;
    }

    // 递归求解/填充剩余
    solve(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.solve(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // 生成完整数独
    generateSolution() {
        this.board = this.initEmptyBoard();
        this.fillDiagonal();
        this.solve(this.board);
        // 保存答案的深拷贝
        this.solution = JSON.parse(JSON.stringify(this.board));
        return this.board;
    }

    // 挖空生成题目
    generatePuzzle(difficulty) {
        // 先生成完整盘面
        this.generateSolution();
        
        // 复制一份作为题目
        let puzzle = JSON.parse(JSON.stringify(this.solution));
        
        const diffLevel = parseInt(difficulty);
        
        if (diffLevel === 1) {
            // --- 难度 1 (儿童模式) 优化：均匀分布挖空 ---
            // 目标：约 20 个空。分布策略：每个宫格挖 2 个，剩余 2 个随机分配。
            
            // 1. 初始化每个宫格需要挖掉的数量 (9个宫格，每个至少2个)
            let holesPerBox = new Array(9).fill(2); 
            let remainingHoles = 2; // 20 - 9*2 = 2
            
            // 2. 随机分配剩余的空缺
            while (remainingHoles > 0) {
                let boxIdx = Math.floor(Math.random() * 9);
                // 限制每个宫格最多挖3个，防止局部太难
                if (holesPerBox[boxIdx] < 3) {
                    holesPerBox[boxIdx]++;
                    remainingHoles--;
                }
            }

            // 3. 执行挖空
            for (let box = 0; box < 9; box++) {
                let count = holesPerBox[box];
                // 计算当前宫格的左上角坐标
                let startRow = Math.floor(box / 3) * 3;
                let startCol = (box % 3) * 3;
                
                while (count > 0) {
                    let r = startRow + Math.floor(Math.random() * 3);
                    let c = startCol + Math.floor(Math.random() * 3);
                    
                    if (puzzle[r][c] !== 0) {
                        puzzle[r][c] = 0;
                        count--;
                    }
                }
            }
        } else {
            // --- 其他难度：随机挖空 ---
            let holes = 0;
            switch(diffLevel) {
                case 2: holes = 30; break;
                case 3: holes = 40; break;
                case 4: holes = 50; break;
                case 5: holes = 60; break; // 大师
                default: holes = 40;
            }

            let attempts = holes;
            while (attempts > 0) {
                let row = Math.floor(Math.random() * 9);
                let col = Math.floor(Math.random() * 9);
                if (puzzle[row][col] !== 0) {
                    puzzle[row][col] = 0;
                    attempts--;
                }
            }
        }
        
        // 更新当前题目盘面
        this.board = puzzle;
        return { puzzle: this.board, solution: this.solution };
    }
}

class App {
    constructor() {
        this.core = new SudokuCore();
        this.currentPuzzle = [];
        this.userGrid = []; // 记录用户输入
        this.selectedCell = null; // {r, c}

        // DOM Elements
        this.boardEl = document.getElementById('sudoku-board');
        this.difficultySelect = document.getElementById('difficulty');
        this.btnNewGame = document.getElementById('btn-new-game');
        this.btnCheck = document.getElementById('btn-check');
        this.btnReset = document.getElementById('btn-reset');
        this.btnPrintModal = document.getElementById('btn-print-modal');
        
        // Print Modal Elements
        this.printModal = document.getElementById('print-modal');
        this.closeModal = document.querySelector('.close-modal');
        this.btnCancelPrint = document.getElementById('btn-cancel-print');
        this.btnConfirmPrint = document.getElementById('btn-confirm-print');
        this.printArea = document.getElementById('print-area');

        // Numpad
        this.numpadBtns = document.querySelectorAll('.num-btn');

        this.init();
    }

    init() {
        // Event Listeners
        this.btnNewGame.addEventListener('click', () => this.startNewGame());
        this.btnCheck.addEventListener('click', () => this.checkAnswer());
        this.btnReset.addEventListener('click', () => this.resetBoard());
        
        this.btnPrintModal.addEventListener('click', () => this.openPrintModal());
        this.closeModal.addEventListener('click', () => this.closePrintModal());
        this.btnCancelPrint.addEventListener('click', () => this.closePrintModal());
        this.btnConfirmPrint.addEventListener('click', () => this.handlePrint());
        window.addEventListener('click', (e) => {
            if (e.target === this.printModal) this.closePrintModal();

            // 点击外部取消选中
            if (!e.target.closest('.cell') && 
                !e.target.closest('.num-btn') && 
                !e.target.closest('button') && 
                !e.target.closest('.modal-content')) {
                this.deselect();
            }
        });

        this.numpadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.getAttribute('data-val');
                this.handleInput(val);
            });
        });

        // Keyboard input
        document.addEventListener('keydown', (e) => {
            const key = e.key;
            // 允许无选中状态下按数字键高亮
            if (key >= '1' && key <= '9') {
                this.handleInput(key);
            } else if (this.selectedCell) {
                // 只有选中时才响应清除和移动
                if (key === 'Backspace' || key === 'Delete') {
                    this.handleInput('clear');
                } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                    this.moveSelection(key);
                }
            }
        });

        // Start initial game
        this.startNewGame();
    }

    startNewGame() {
        const diff = this.difficultySelect.value;
        const data = this.core.generatePuzzle(diff);
        this.currentPuzzle = JSON.parse(JSON.stringify(data.puzzle));
        
        // 初始化用户网格（0 表示空）
        this.userGrid = JSON.parse(JSON.stringify(this.currentPuzzle));
        
        this.renderBoard();
        this.selectedCell = null;
        // 清除残留高亮
        document.querySelectorAll('.cell.highlight-same').forEach(el => el.classList.remove('highlight-same'));
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // 添加样式 class 用于粗边框
                if ((j + 1) % 3 === 0 && j !== 8) cell.classList.add('border-right');
                if ((i + 1) % 3 === 0 && i !== 8) cell.classList.add('border-bottom');

                const val = this.userGrid[i][j];
                const isFixed = this.currentPuzzle[i][j] !== 0;

                if (val !== 0) {
                    cell.textContent = val;
                }

                if (isFixed) {
                    cell.classList.add('fixed');
                }
                
                // 允许所有格子被点击选中（包括固定格），以便触发高亮
                cell.addEventListener('click', () => this.selectCell(i, j));

                this.boardEl.appendChild(cell);
            }
        }
    }

    selectCell(r, c) {
        // 清除旧的高亮
        document.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
        
        // 选中新格
        this.selectedCell = { r, c };
        const idx = r * 9 + c;
        const cell = this.boardEl.children[idx];
        cell.classList.add('selected');

        // 如果格子有数字，高亮该数字；如果是空格，清除高亮
        const val = this.userGrid[r][c];
        if (val !== 0) {
            this.highlightSameNumbers(val);
        } else {
            document.querySelectorAll('.cell.highlight-same').forEach(el => el.classList.remove('highlight-same'));
        }
    }

    deselect() {
        this.selectedCell = null;
        document.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.cell.highlight-same').forEach(el => el.classList.remove('highlight-same'));
    }

    highlightSameNumbers(num) {
        // 先清除旧的高亮
        document.querySelectorAll('.cell.highlight-same').forEach(el => el.classList.remove('highlight-same'));
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.userGrid[i][j] == num) {
                    this.boardEl.children[i * 9 + j].classList.add('highlight-same');
                }
            }
        }
    }

    handleInput(val) {
        // 1. 优先处理高亮逻辑 (只要是数字)
        if (val !== 'clear') {
            const num = parseInt(val);
            this.highlightSameNumbers(num);
        }

        // 2. 如果没有选中格子，或者选中的是固定格，则不进行填值操作
        if (!this.selectedCell) return;
        const { r, c } = this.selectedCell;

        if (this.currentPuzzle[r][c] !== 0) return; // 固定格子不可改

        const idx = r * 9 + c;
        const cell = this.boardEl.children[idx];

        // 无论输入什么，先移除错误标记
        cell.classList.remove('error');

        if (val === 'clear') {
            this.userGrid[r][c] = 0;
            cell.textContent = '';
            // 清除内容后，该格子不再具备数字，移除其高亮样式
            cell.classList.remove('highlight-same');
        } else {
            const num = parseInt(val);
            this.userGrid[r][c] = num;
            cell.textContent = num;
            
            // 重新刷新高亮，确保新填入的格子也被高亮
            this.highlightSameNumbers(num);
        }
    }

    moveSelection(key) {
        if (!this.selectedCell) return;
        let { r, c } = this.selectedCell;
        
        switch(key) {
            case 'ArrowUp': r = Math.max(0, r - 1); break;
            case 'ArrowDown': r = Math.min(8, r + 1); break;
            case 'ArrowLeft': c = Math.max(0, c - 1); break;
            case 'ArrowRight': c = Math.min(8, c + 1); break;
        }

        // 如果新位置是固定的，依然可以选中高亮，只是不能改
        // 这里逻辑上允许选中固定格，方便查看相同数字，但在 handleInput 里拦截修改
        // 更新 UI 选中状态
        document.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.cell.highlight-same').forEach(el => el.classList.remove('highlight-same'));
        
        this.selectedCell = { r, c };
        const idx = r * 9 + c;
        const cell = this.boardEl.children[idx];
        cell.classList.add('selected');
        
        if (this.userGrid[r][c] !== 0) {
            this.highlightSameNumbers(this.userGrid[r][c]);
        }
    }

    checkAnswer() {
        let isCorrect = true;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const val = this.userGrid[i][j];
                const cell = this.boardEl.children[i * 9 + j];
                cell.classList.remove('error');

                // 检查1：不能为空
                if (val === 0) {
                    // 可以选择忽略空值，只检查已填的，或者标记空值
                    // 这里仅检查已填的错误
                    continue;
                }

                // 检查2：是否与答案一致
                if (val !== this.core.solution[i][j]) {
                    cell.classList.add('error');
                    isCorrect = false;
                }
            }
        }
        
        if (isCorrect) {
            // 简单检查是否全填满了
            let isFull = true;
            for(let r=0; r<9; r++) if(this.userGrid[r].includes(0)) isFull = false;
            
            if (isFull) alert("恭喜！你成功完成了数独！");
            else alert("目前填写的数字都是正确的，请继续加油！");
        } else {
            alert("发现一些错误，已用红色标记。");
        }
    }

    resetBoard() {
        if (!confirm("确定要重置当前游戏吗？所有进度将丢失。")) return;
        this.userGrid = JSON.parse(JSON.stringify(this.currentPuzzle));
        this.renderBoard();
        this.selectedCell = null;
    }

    // --- 打印逻辑 ---

    openPrintModal() {
        this.printModal.classList.remove('hidden');
        this.printModal.style.display = 'flex'; // 强制显示
    }

    closePrintModal() {
        this.printModal.classList.add('hidden');
        this.printModal.style.display = 'none';
    }

    handlePrint() {
        try {
            const difficulty = document.getElementById('print-difficulty').value;
            const count = parseInt(document.getElementById('print-count').value);
            // 获取用户输入的页数，默认为1，最大限制为20（防止浏览器卡死）
            let pages = parseInt(document.getElementById('print-pages').value) || 1;
            if (pages < 1) pages = 1;
            if (pages > 20) pages = 20;

            const startIndex = parseInt(document.getElementById('print-start-index').value) || 1;
            
            this.generatePrintContent(difficulty, count, pages, startIndex);
            
            this.closePrintModal();
            
            // 延时 800ms 确保 DOM 渲染完成，尤其是多题目的情况
            setTimeout(() => {
                window.print();
            }, 800);
        } catch (e) {
            alert("打印生成失败: " + e.message);
            console.error(e);
        }
    }

    generatePrintContent(difficulty, puzzlesPerPage, totalPages, startIndex = 1) {
        this.printArea.innerHTML = '';
        
        // 临时核心实例
        const printCore = new SudokuCore();
        
        let globalPuzzleIndex = startIndex;

        for (let p = 0; p < totalPages; p++) {
            // 创建每一页的容器
            const page = document.createElement('div');
            page.classList.add('print-page');
            page.classList.add(`print-layout-${puzzlesPerPage}`);

            for (let k = 0; k < puzzlesPerPage; k++) {
                // 生成新题目
                const puzzleData = printCore.generatePuzzle(difficulty);
                const puzzle = puzzleData.puzzle;
                
                const itemContainer = document.createElement('div');
                itemContainer.classList.add('print-item');

                const title = document.createElement('div');
                title.classList.add('print-title');
                title.textContent = `题目 ${globalPuzzleIndex} (难度 ${difficulty})`;
                itemContainer.appendChild(title);
                
                globalPuzzleIndex++; // 序号递增

                const boardDiv = document.createElement('div');
                boardDiv.classList.add('print-board');

                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 9; j++) {
                        const cell = document.createElement('div');
                        cell.classList.add('print-cell');
                        // 修正：边框逻辑与 CSS 匹配
                        if ((j + 1) % 3 === 0 && j !== 8) cell.classList.add('border-right');
                        if ((i + 1) % 3 === 0 && i !== 8) cell.classList.add('border-bottom');
                        
                        const val = puzzle[i][j];
                        if (val !== 0) {
                            const span = document.createElement('span');
                            span.classList.add('print-cell-content');
                            span.textContent = val;
                            cell.appendChild(span);
                        }
                        boardDiv.appendChild(cell);
                    }
                }
                itemContainer.appendChild(boardDiv);
                page.appendChild(itemContainer);
            }
            this.printArea.appendChild(page);
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.sudokuApp = new App();
});