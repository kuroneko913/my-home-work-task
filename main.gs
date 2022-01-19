function createTaskAtWeekDayMorning()
{
  let task = new MyHomeWorkTask
  let date = new Date(Date.now())
  // 失敗にある完了タスクを削除する
  task.deleteCompletedFailedTask()
  task.createTaskFromSpreadSheet('平日の朝', date)
}

function createTaskAtWeekDayEvening()
{
  let task = new MyHomeWorkTask()
  let date = new Date(Date.now())
  // 失敗にある完了タスクを削除する
  task.deleteCompletedFailedTask()
  // 実行結果によってセクション移動
  task.moveFailedTask()
  task.moveSuccessTask()
  task.createTaskFromSpreadSheet('平日の夜', date)
}

function createTaskAtHolidayDaytime()
{
  let task = new MyHomeWorkTask
  let date = new Date(Date.now())
  // 失敗にある完了タスクを削除する
  task.deleteCompletedFailedTask()
  task.createTaskFromSpreadSheet('休日の昼間', date)
}

function createTaskAtHolidayEvening()
{
  let task = new MyHomeWorkTask()
  let date = new Date(Date.now())
  // 失敗にある完了タスクを削除する
  task.deleteCompletedFailedTask()
  // 実行結果によってセクション移動
  task.moveFailedTask()
  task.moveSuccessTask()
  task.createTaskFromSpreadSheet('休日の夜', date)
}

function dailyBatch(){
  let task = new MyHomeWorkTask()
  // 失敗にある完了タスクを削除する
  task.deleteCompletedFailedTask()
  // 失敗したタスクを失敗に移動させる
  task.moveFailedTask()
  // 完了したタスクを成功に移動させる
  task.moveSuccessTask()
  let success_tasks = ['平日の朝', '平日の夜', '休日の昼間', '休日の夜'].map(v=>{
    return task.getTaskPoints(task.SECTION_ID_SUCCESS, v)
  })
  let failed_tasks = ['平日の朝', '平日の夜', '休日の昼間', '休日の夜'].map(v=>{
    return task.getTaskPoints(task.SECTION_ID_FAILED, v)
  })
  let success_count = success_tasks.reduce((sum,i)=>sum + i.count, 0)
  let success_points = success_tasks.reduce((sum,i)=>sum+i.point, 0)
  let failed_count = failed_tasks.reduce((sum,i)=>sum + i.count, 0)
  let failed_points = failed_tasks.reduce((sum,i)=>sum+i.point, 0)
 
  // LINEに送る
  let notifier = new LINE_notify
  task.sendNotify(notifier, '\nマイホームワークタスク!!\n今日のやれてえらいポイント:'+success_points+'\nやれたらえらかったポイント:'+failed_points)

  // スプレッドシートに追記する
  task.addHistoryToSpreadSheet('デイリー集計シート',[success_count, failed_count, success_points, failed_points])

  // 成功にあるタスクを削除する
  task.deleteSuccessTask()
}

function test_deleteSuccessTask()
{
  let task = new MyHomeWorkTask()
  task.moveSuccessTask()
  task.deleteSuccessTask()
}

function test_deleteCompletedFailedTask()
{
  // 失敗にある完了タスクを削除する
  let task = new MyHomeWorkTask()
  task.deleteCompletedFailedTask()
}