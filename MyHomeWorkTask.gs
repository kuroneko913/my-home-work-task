class MyHomeWorkTask {
  constructor(){
    const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID')
    const PROJECT_ID = PropertiesService.getScriptProperties().getProperty('PROJECT_ID')
    const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN')
    const USER_ID = PropertiesService.getScriptProperties().getProperty('USER_ID')
    const SECTION_ID_TODO = PropertiesService.getScriptProperties().getProperty('SECTION_ID_TODO')
    const SECTION_ID_SUCCESS = PropertiesService.getScriptProperties().getProperty('SECTION_ID_SUCCESS')
    const SECTION_ID_FAILED = PropertiesService.getScriptProperties().getProperty('SECTION_ID_FAILED')
    
    this.user_id = USER_ID
    this.taskApi = new AsanaTaskApi(ACCESS_TOKEN, PROJECT_ID)
    this.spreadsheet = SpreadsheetApp.openById(SHEET_ID)
    Object.defineProperties(this,{
      'SECTION_ID_TODO':{value: SECTION_ID_TODO},
      'SECTION_ID_SUCCESS':{value: SECTION_ID_SUCCESS},
      'SECTION_ID_FAILED':{value: SECTION_ID_FAILED},
    })
  }

  // 完了したタスクを自動的に成功に移動させる(期限は考慮していない)
  moveSuccessTask()
  {
    let completed_task_ids = this.taskApi.getCompletedTask(this.SECTION_ID_TODO)
    Logger.log(this.getMethodName())
    completed_task_ids.map(id=>{
      Logger.log(id)
      this.taskApi.changeStatus(id, this.SECTION_ID_SUCCESS)
    })
  }

  // TODOにある期限切れの未完了タスクを失敗に移動させる
  moveFailedTask()
  {
    let over_due_task_ids = this.taskApi.getOverDueTask(this.SECTION_ID_TODO)
    Logger.log(this.getMethodName())
    over_due_task_ids.map(id=>{
      Logger.log(id)
      this.taskApi.changeStatus(id, this.SECTION_ID_FAILED)
    })
  }

  deleteSuccessTask() 
  {
    let success_ids = this.taskApi.getTaskBySection(this.SECTION_ID_SUCCESS)
    if (success_ids.length > 0) {
      Logger.log(this.getMethodName())
      success_ids.map(id=>{
        Logger.log(id)
        this.taskApi.deleteTask(id)
      })
    }
  }

  deleteCompletedFailedTask()
  {
    // 失敗にあるもののうち完了しているものを削除する(前日の失敗したタスクは全て手で完了する)
    let completed_task_ids = this.taskApi.getCompletedTask(this.SECTION_ID_FAILED)
    if(completed_task_ids.length > 0) {
      Logger.log(this.getMethodName())
      completed_task_ids.map(id=>{
        Logger.log(id)
        this.taskApi.deleteTask(id)
      })
    }
  }

  getTaskNameFromSection(section_id)
  {
    // セクションに含まれるタスク(id)を取得する
    let ids = this.taskApi.getTaskBySection(section_id)
    // 1件ずつタスク名を取得する
    let task_names = ids.map(id=>{
      let response = this.taskApi.get(id)
      let json_data = JSON.parse(response)
      return json_data.data.name
    })
    return task_names
  }

  // セクションごとにポイントを集計する
  getTaskPoints(section_id, sheet_name)
  {
    // セクションに含まれるタスク名を取得する
    let task_names = this.getTaskNameFromSection(section_id)
    // スプレッドシートにあるタスクを取得し、タスク名=>ポイントの連想配列を取得する
    let task_name_dict = this.getTaskPointDict(sheet_name)
    // タスクの合計ポイントを計算する
    let total_points = task_names.map(task_name=>{
      if (task_name_dict[task_name] === undefined) return
      return task_name_dict[task_name]
    }).filter(point=>{
      return point !== undefined
    }).reduce((sum,point)=>sum+point,0)
    return {'count': task_names.length, 'point':total_points }
  }

  // スプレッドシートからタスク名=>タスクのポイントの連想配列を作成する 
  getTaskPointDict(sheet_name){
    let values = this.getSpreadSheetValues(sheet_name)
    let task_name_dict = {}
    for(const [key, value] of Object.entries(values)) {
      if (value === undefined) continue
      task_name_dict[Object.values(value)[0]] = Object.values(value)[3]
    }
    return task_name_dict
  }

  addHistoryToSpreadSheet(sheet_name, histories){
    let sheet = this.spreadsheet.getSheetByName(sheet_name)
    let date_ = new Date()
    date_.setDate(date_.getDate()-1)
    let date = Utilities.formatDate(date_, "JST", "yyyy-MM-dd")
    let append_row = [date,histories[0],histories[1],histories[2],histories[3]]
    Logger.log(this.getMethodName())
    Logger.log(append_row)
    sheet.appendRow(append_row)
  }

  sendNotify(notifier, message){
    notifier.call(message)
  }

  getSpreadSheetValues(sheet_name) {
    let sheet = this.spreadsheet.getSheetByName(sheet_name)
    let values = sheet.getRange(2,1,100,4).getValues()
    return values.map(row=>{
      if(row !== undefined && row[0] !== '' && row[2] !=='' && row[3] !=='') return row
    })
  }

  createTaskFromSpreadSheet(sheet_name, task_due_date) {
    let values = this.getSpreadSheetValues(sheet_name)
    let today = new Date(Date.now())
    let next_date = new Date(Date.now())
    next_date.setDate(today.getDate()+1)
    values.map((row)=>{
      if (row === undefined) return
      let date = new Date(row[2])
      let task_due_at = today
      // 日付変わる時
      if(date.getHours() === 0 && date.getMinutes() === 0) {
        task_due_date = next_date
      }
      task_due_at.setHours(date.getHours())
      task_due_at.setMinutes(date.getMinutes())
      task_due_at.setSeconds(date.getSeconds())
      let payload = {'data':{
        'name': row[0],
        'notes': row[1]+'\n'+'やったらえらいポイント:'+row[3],
        'assignee': this.user_id,
        'due_at': Utilities.formatDate(task_due_at, "GMT", "yyyy-MM-dd'T'HH:mm:ssZ"),
      }}
      Logger.log(payload)
      this.taskApi.createTask(payload)
    })
  }

  // https://www.uebu-kaihatsu.jp.net/ja/javascript/typescript%E3%83%A1%E3%82%BD%E3%83%83%E3%83%89%E5%86%85%E3%81%8B%E3%82%89%E3%83%A1%E3%82%BD%E3%83%83%E3%83%89%E5%90%8D%E3%82%92%E5%8F%96%E5%BE%97%E3%81%99%E3%82%8B/832946289/
  getMethodName() {
    var err = new Error();
    return /at \w+\.(\w+)/.exec(err.stack.split('\n')[2])[1] // we want the 2nd method in the call stack
  }

}