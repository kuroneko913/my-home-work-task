function createTaskAtWeekDayMorning()
{
  let task = new MyHomeWorkTask
  let date = new Date(Date.now())
  task.createTaskFromSpreadSheet('平日の朝', date)
}

function createTaskAtWeekDayEvening()
{
  moveFailedTask()
  let task = new MyHomeWorkTask()
  let date = new Date(Date.now())
  task.createTaskFromSpreadSheet('平日の夜', date)
}

function dailyBatch(){
  let task = new MyHomeWorkTask()
  // 失敗にあるもののうち完了しているものを削除する(前日の失敗したタスクは全て手で完了する)
  let completed_task_ids = task.taskApi.getCompletedTask(task.SECTION_ID_FAILED)
  console.log({completed_task_ids})
  if(completed_task_ids.length > 0) {
    completed_task_ids.map((id)=>{task.taskApi.removeTask(id)})
  }
  moveFailedTask()
  let success_tasks = ['平日の朝', '平日の夜'].map(v=>{
    return getTaskPoints(task.SECTION_ID_SUCCESS, v)
  })
  let failed_tasks = ['平日の朝', '平日の夜'].map(v=>{
    return getTaskPoints(task.SECTION_ID_FAILED, v)
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

  let success_ids = task.taskApi.getTaskBySection(task.SECTION_ID_SUCCESS)
  if(success_ids.length > 0) {
    task.taskApi.removeTask(success_ids)
  }
}

function moveFailedTask()
{
  let task = new MyHomeWorkTask
  let over_due_task_ids = task.taskApi.getOverDueTask(task.SECTION_ID_TODO)
  over_due_task_ids.map(id=>{
    this.taskApi.changeStatus(id, task.SECTION_ID_FAILED)
  })
}

// セクションごとにポイントを集計する
function getTaskPoints(section_id, sheet_name){
  let task = new MyHomeWorkTask()
  // セクションに含まれるタスク(id)を取得する
  let ids = task.taskApi.getTaskBySection(section_id)
  // 1件ずつタスク名を取得する
  let task_names = ids.map(id=>{
    let response = task.taskApi.get(id)
    let json_data = JSON.parse(response)
    return json_data.data.name
  })
  // スプレッドシートにあるタスクを取得し、タスク名=>ポイントの連想配列を取得する
  let task_name_dict = task.getTaskPointDict(sheet_name)
  // タスクの合計ポイントを計算する
  let total_points = task_names.map(task_name=>{
    if (task_name_dict[task_name] === undefined) return
    return task_name_dict[task_name]
  }).filter(point=>{
    return point !== undefined
  }).reduce((sum,point)=>sum+point,0)
  return {'count': task_names.length, 'point':total_points }
}

function test_MyHomeworkTask(){
  let task = new MyHomeWorkTask()
  let date = new Date(Date.now())
  task.createTaskFromSpreadSheet('平日の朝', date)
}

function test() {
  MyHomeWorkTask = new MyHomeWorkTask()

  let taskApi = MyHomeWorkTask.taskApi
  let task_due_at = new Date('2022-01-16T16:00:00')
  taskApi.createTask({'data':{
    'name': 'API test!!',
    'notes': 'Asana Apiによって追加されました',
    'assignee': MyHomeWorkTask.user_id,
    'due_at': Utilities.formatDate(task_due_at, "GMT", "yyyy-MM-dd'T'HH:mm:ssZ")
  }})
  let result = taskApi.getOverDueTask(MyHomeWorkTask.SECTION_ID_TODO)
  result.map(id=>{
    console.log({id})
    taskApi.changeStatus(id, MyHomeWorkTask.SECTION_ID_FAILED)
    taskApi.removeTask(id)
  })
  
  // To-Doをお掃除。
  let todo_ids = taskApi.getTaskBySection(MyHomeWorkTask.SECTION_ID_TODO)
  todo_ids.map(id=>taskApi.removeTask(id))

  // Successをお掃除。
  let success_ids = taskApi.getTaskBySection(MyHomeWorkTask.SECTION_ID_SUCCESS)
  success_ids.map(id=>taskApi.removeTask(id))

  // 失敗にあるもののうち完了しているものを削除する(前日の失敗したタスクは全て手で完了する)
  let completed_task_ids = taskApi.getCompletedTask(MyHomeWorkTask.SECTION_ID_FAILED)
  console.log({completed_task_ids})
  if(completed_task_ids.length > 0) {
    completed_task_ids.map((id)=>{taskApi.removeTask(id)})
  }
}