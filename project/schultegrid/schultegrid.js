
function updateTime(that, time)
{
  if (!that.data.isTimer)
  {
    return;
  }

  //计算已经经过的时间
  var timeStamp = Date.now();
  var pastTime = (timeStamp - that.data.startTime) / 1000;
      
  //设置数据
  that.setData({
    time: pastTime.toFixed(1)
  });

  setTimeout(
    function()
    {
      updateTime(that, 100);
    }, time);
}

// 设置结算页面
function showResult(that)
{
  //把自己改为已经经过的时间
  var timestamp = Date.now();
  that.data.startTime = timestamp - that.data.startTime;

  //停止更新倒计时
  that.data.isTimer = false;

  //存储数据
  wx.setStorageSync(
    'Schultegrid-minTimer-' + that.data.blockNum,
    (that.data.startTime < that.data.minTimer || 0 == that.data.minTimer) ? that.data.startTime : that.data.minTimer);

  wx.setStorageSync(
    'Schultegrid-maxScore-' + that.data.blockNum,
    (that.data.totalScore > that.data.maxScore) ? that.data.totalScore : that.data.maxScore);

  wx.setStorageSync(
    'Schultegrid-maxCombo-' + that.data.blockNum,
    (that.data.thisMaxCombo > that.data.maxCombo) ? that.data.thisMaxCombo : that.data.maxCombo);

  //一秒以后执行
  setTimeout(
    function () 
    {
      that.gridanimation.scale(1).rotate(0).step({duration:1000});

      that.setData({
        isInit: true,
        gridsNum: that.data.gridsNums,
        gridanimation: that.gridanimation.export(),

        //Data:结算数据
        time: (that.data.startTime / 1000).toFixed(1) + ((that.data.startTime < that.data.minTimer || that.data.minTimer == 0) ? '↑' : ''),
        combo: '' + that.data.thisMaxCombo + ((that.data.thisMaxCombo > that.data.maxCombo) ? '↑' : ''),
        score: '' + that.data.totalScore.toFixed(0) + ((that.data.totalScore > that.data.maxScore) ? '↑' : ''),

        //UI:单局结束后的界面显示
        showScore: true,
        showTimer: true,
        showCombo: true,

        showPause: false,
        showNext: true,
        
        showQuit: false,
        showRenew: false,
        showGoOn: false,
        
        showLevel: false,
        showStart: false,
      });

    }, 1000);
}

// 用于增减难度，重置菱格
function resetGrid(that) 
{
  //创建动画
  var animation = wx.createAnimation(
    {
      duration: 5000,
      timingFunction: "ease",
    })

  //根据难度重置宽、高、字体大小
  that.gridanimation = animation;

  that.data.gridwidth = 600.0 / that.data.blockNum;
  that.data.gridheight = 600.0 / that.data.blockNum;
  that.data.fontsize = 300.0 / that.data.blockNum;

  //启动数值设置为1
  that.data.runningNum = 1;

  var maxCount = that.data.blockNum * that.data.blockNum;

  //初始化动画属性
  that.gridanimation.rotate(0).scale(1).step({ duration: 1 });

  that.data.minTimer = wx.getStorageSync('Schultegrid-minTimer-' + that.data.blockNum);
  if (that.data.minTimer == '') 
  {
    that.data.minTimer = 0;
  }

  that.data.maxScore = wx.getStorageSync('Schultegrid-maxScore-' + that.data.blockNum);
  if (that.data.maxScore == '') 
  {
    that.data.maxScore = 0;
  }

  that.data.maxCombo = wx.getStorageSync('Schultegrid-maxCombo-' + that.data.blockNum);
  if (that.data.maxCombo == '')
  {
    that.data.maxCombo = 0;
  }
}

function resetGame (that)
{
  //重置开始时间和点击时间
  var timestamp = Date.now();
  that.data.startTime = timestamp;
  that.data.lastTime = timestamp;

  //开启计时
  that.data.isTimer = true;

  //一秒以后执行
  updateTime(that, 100);

  //初始化分数和时间
  that.data.time = 0;
  that.data.totalScore = 0;
  that.data.thisCombo = 0;
  that.data.thisMaxCombo = 0;

  //启动数值设置为1
  that.data.runningNum = 1;

  //按当前难度的平方顺序填充数据
  var maxCount = that.data.blockNum * that.data.blockNum;

  var basicNums = [];

  var curNum = 1;
  for (var count = 0; count < maxCount; count++) 
  {
    basicNums[count] = curNum++;
  }

  //开始进行随机搬移，确保最后顺序打乱
  var fillCount = 0;
  for(var count = maxCount-1; count >= 0; count--)
  {
    var index = Math.round(Math.random() * count);

    that.data.gridsNums[fillCount] = basicNums[index];
    basicNums[index] = basicNums[count];

    fillCount++;
  }

  //初始化动画属性
  that.gridanimation.rotate(0).scale(1).step({ duration: 1 });
}

Page({
  data: {
    gridsStar: [],
    gridsAnis: [],
    gridsNums: [],
    blockNum: 3,
    gridwidth: 120,
    gridheight: 120,
    fontsize: 60,
    runningNum: 1,

    minTimer: 0,
    maxScore: 0,
    maxCombo: 0,

    totalScore: 0,
    startTime: 0,
    lastTime: 0,
    thisCombo: 0,
    thisMaxCombo: 0,
  },

  onClick: function(e)
  {
    //获取当前点击的菱格Index
    var curIndex = e.currentTarget.id;

    //如果菱格已经点过了，什么都不做
    if (this.data.runningNum > this.data.gridsNums[curIndex])
    {
      return;
    }
    //如果菱格还没有达到
    if (this.data.runningNum < this.data.gridsNums[curIndex])
    {
      // 播放抖动提示动画
      this.gridanimation.rotate(20).scale(1.0).step({ delay:0,duration:20 });
      this.gridanimation.rotate(-20).scale(1.1).step({ delay:20, duration:20 });
      this.gridanimation.rotate(20).scale(1.2).step({ delay: 40, duration: 20 });
      this.gridanimation.rotate(-20).scale(1.1).step({ delay: 60, duration: 20 });
      this.gridanimation.rotate(0).scale(1.0).step({ delay: 80, duration: 20 });
    }
    //如果点击正确
    else
    {
      // 正确点击数+1
      this.data.runningNum++;

      // 播放旋转消失提示动画
      this.gridanimation.rotate(360).scale(0).step({ duration: 1000 });

      var timestamp = Date.now();
      var deltaTime = timestamp - this.data.lastTime;
      this.data.lastTime = timestamp;

      if(deltaTime > 1000)
      {
        this.data.thisCombo = 0;
      }
      else
      {
        this.data.thisCombo++;
        if (this.data.thisCombo > this.data.thisMaxCombo)
        {
          this.data.thisMaxCombo = this.data.thisCombo;
        }
      }

      var score = 1000 * 1000 / deltaTime;
      score = Math.max(Math.min(score, 2000), 500);
      score = score * (10 + this.data.thisCombo) / 10;

      this.data.totalScore += score;
    }

    // 设置数据
    this.setData({
      isInit: false,
      currentIndex: curIndex,
      gridanimation: this.gridanimation.export(),

      score: this.data.totalScore.toFixed(0),
      combo: this.data.thisCombo
    })

    // 如果选择的数量超过了目标数量，显示结算画面
    if (this.data.runningNum > this.data.blockNum * this.data.blockNum)
    {
      showResult(this);
    }
  },

  onRenew: function () 
  {
    resetGame(this);

    //设置数据
    this.setData({
      isInit: true,
      gridsNum: this.data.gridsNums,
      
      gridanimation: this.gridanimation.export(),

      //Data:重置数据
      time: 0.0.toFixed(1),
      score: 0,
      combo: 0,

      //UI:重开一局的界面显示
      showScore: true,
      showTimer: true,
      showCombo: true,

      showPause: true,
      showNext: false,

      showQuit: false,
      showRenew: false,
      showGoOn: false,

      showLevel: false,
      showStart: false,
    });
  },

  onQuit: function () 
  {
    resetGrid(this);

    //设置数据
    this.setData({
      isInit: true,
      gridsNum: this.data.gridsStar,
      blockNum: this.data.blockNum,
      gridwidth: this.data.gridwidth,
      gridheight: this.data.gridheight,
      fontsize: this.data.fontsize,
      gridanimation: this.gridanimation.export(),

      //Data:设置历史分数
      time: (this.data.minTimer / 1000).toFixed(1),
      score: this.data.maxScore.toFixed(0),
      combo: this.data.maxCombo,

      //UI:退出重开的界面显示
      showScore: true,
      showTimer: true,
      showCombo: true,

      showPause: false,
      showNext: false,

      showQuit: false,
      showRenew: false,
      showGoOn: false,

      showLevel: true,
      showStart: true,
    });
  },

  onGoOn: function () 
  {
    //当前时间减去已经经过的时间得到新的开始时间
    var timestamp = Date.now();
    this.data.startTime = timestamp - this.data.startTime;

    //停止更新倒计时
    this.data.isTimer = true;

    //凑够1000毫秒以后执行更新时间
    updateTime(this, 100 - ((timestamp-this.data.startTime)%100));

    //设置数据
    this.setData({
      isInit: true,
      gridsNum: this.data.gridsNums,
      gridanimation: this.gridanimation.export(),

      //UI:继续当前局的界面显示
      showScore: true,
      showTimer: true,
      showCombo: true,

      showPause: true,
      showNext: false,
            
      showQuit: false,
      showRenew: false,
      showGoOn: false,

      showLevel: false,
      showStart: false,
    });
  },

  onPause: function()
  {
    //如果已经结束了，Pause无法点击
    if (this.data.runningNum > this.data.blockNum * this.data.blockNum)
    {
      return;
    }

    //把自己改为已经经过的时间
    var timestamp = Date.now();
    this.data.startTime = timestamp - this.data.startTime;

    //停止更新倒计时
    this.data.isTimer = false;
    
    //设置数据
    this.setData({
      isInit: true,
      gridsNum: this.data.gridsStar,
      gridanimation: this.gridanimation.export(),

      //UI:暂停的界面显示
      showScore: true,
      showTimer: true,
      showCombo: true,

      showPause: false,
      showNext: false,

      showQuit: true,
      showRenew: true,
      showGoOn: true,
      
      showLevel: false,
      showStart: false,
    });
  },

  onStart: function()
  {
    resetGame(this);

    //设置数据
    this.setData({
      isInit: true,
      gridsNum: this.data.gridsNums,
      gridanimation: this.gridanimation.export(),

      //Data:初始化
      time: 0.0.toFixed(1),
      score: 0,
      combo: 0,

      //UI:开局时的界面显示
      showScore: true,
      showTimer: true,
      showCombo: true,

      showPause: true,
      showNext: false,
      
      showQuit: false,
      showRenew: false,
      showGoOn: false,

      showLevel: false,
      showStart: false,
    });
  },

  // 增加难度
  onIncLevel: function()
  {
    //难度最大不超过7格
    if (this.data.blockNum >= 7)
    {
      return;
    }

    this.data.blockNum++;

    //重置游戏
    resetGrid(this);

    //设置数据
    this.setData({
      isInit: true,
      gridsNum: this.data.gridsStar,
      blockNum: this.data.blockNum,
      gridwidth: this.data.gridwidth,
      gridheight: this.data.gridheight,
      fontsize: this.data.fontsize,
      gridanimation: this.gridanimation.export(),

      //Data:设置历史分数
      time: (this.data.minTimer / 1000).toFixed(1),
      score: this.data.maxScore.toFixed(0),
      combo: this.data.maxCombo,

      //UI:改变难度时的界面显示
      showScore: true,
      showTimer: true,
      showCombo: true,

      showPause: false,
      showNext: false,
            
      showQuit: false,
      showRenew: false,
      showGoOn: false,

      showLevel: true,
      showStart: true,
    });
  },

  // 降低难度
  onDecLevel: function () 
  {
    //难度最小不超过7格
    if (this.data.blockNum <= 3)
    {
      return;
    }

    this.data.blockNum--;

    //重置游戏
    resetGrid(this);

    //设置数据
    this.setData({
      isInit: true,
      gridsNum: this.data.gridsStar,
      blockNum: this.data.blockNum,
      gridwidth: this.data.gridwidth,
      gridheight: this.data.gridheight,
      fontsize: this.data.fontsize,
      gridanimation: this.gridanimation.export(),

      //Data:设置历史分数
      time: (this.data.minTimer / 1000).toFixed(1),
      score: this.data.maxScore.toFixed(0),
      combo: this.data.maxCombo,

      //UI:改变难度时的界面显示
      showScore: true,
      showTimer: true,
      showCombo: true,

      showPause: false,
      showNext: false,

      showQuit: false,
      showRenew: false,
      showGoOn: false,

      showLevel: true,
      showStart: true,
    });
  },

  onLoad: function () 
  {
    //所有的Grids显示为★
    for (var gridIndex = 0; gridIndex < 7 * 7; gridIndex++) 
    {
      this.data.gridsStar[gridIndex] = '★';
    }

    resetGrid(this);

    //设置数据
    this.setData({
      isInit: true,
      gridsNum: this.data.gridsStar,
      blockNum: this.data.blockNum,
      gridwidth: this.data.gridwidth,
      gridheight: this.data.gridheight,
      fontsize: this.data.fontsize,
      gridanimation: this.gridanimation.export(),

      //Data:设置历史分数
      time: (this.data.minTimer/1000).toFixed(1),
      score: this.data.maxScore.toFixed(0),
      combo: this.data.maxCombo,

      //UI:从头开始的界面显示
      showScore: true,
      showTimer: true,
      showCombo: true,

      showPause: false,
      showNext: false,

      showQuit: false,
      showRenew: false,
      showGoOn: false,

      showLevel: true,
      showStart: true,
    });
  }
})
