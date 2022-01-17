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

  addHistoryToSpreadSheet(sheet_name, histories){
    let sheet = this.spreadsheet.getSheetByName(sheet_name)
    let date_ = new Date()
    date_.setDate(date_.getDate()-1)
    let date = Utilities.formatDate(date_, "JST", "yyyy-MM-dd")
    sheet.appendRow([date,histories[0],histories[1],histories[2],histories[3]])
  }

  sendNotify(notifier, message){
    notifier.call(message)
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

  getSpreadSheetValues(sheet_name) {
    let sheet = this.spreadsheet.getSheetByName(sheet_name)
    let values = sheet.getRange(2,1,100,4).getValues()
    return values.map(row=>{
      if(row !== undefined && row[0] !== '' && row[2] !=='' && row[3] !=='') return row
    })
  }

  createTaskFromSpreadSheet(sheet_name, task_due_date) {
    let values = this.getSpreadSheetValues(sheet_name)
    values.map((row)=>{
      if (row === undefined) return
      let date = new Date(row[2])
      let task_due_at = task_due_date
      task_due_at.setHours(date.getHours())
      task_due_at.setMinutes(date.getMinutes())
      task_due_at.setSeconds(date.getSeconds())
      // 日付変わる時
      if(date.getHours() === 0 && date.getMinutes() === 0) {
        task_due_date.setDate(task_due_date.getDate()+1)
      }
      let payload = {'data':{
        'name': row[0],
        'notes': row[1]+'\n'+'やったらえらいポイント:'+row[3],
        'assignee': this.user_id,
        'due_at': Utilities.formatDate(task_due_at, "GMT", "yyyy-MM-dd'T'HH:mm:ssZ"),
      }}
      console.log({payload})
      this.taskApi.createTask(payload)
    })
  }
}