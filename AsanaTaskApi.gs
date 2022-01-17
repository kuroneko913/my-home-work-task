class AsanaTaskApi {

  constructor(access_token, project_id){
    this.project_id = project_id
    this.base = 'https://app.asana.com/api/1.0'
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer '+access_token,
    }
  }

  get(task_id){
    return UrlFetchApp.fetch(this.base+'/tasks/'+task_id, {headers:this.headers})
  }

  // Asanaにタスクを追加する
  createTask(data){
    // payload: {
    //   'data': {
    //     'name': '' // タスク名,
    //     'notes':'' // 説明,
    //     'assignee':'' // タスクアサイン,
    //     'due_at':'',// utc
    //   }
    // }

    data['data']['projects'] = this.project_id
    let options = {
      'headers': this.headers,
      'method': 'post',
      'payload': JSON.stringify(data),
    }
    UrlFetchApp.fetch(this.base+'/tasks', options)
  }

  // セクションごとにタスクを取得する
  getTaskBySection(section_id){
    // セクションごとにタスクのIDを1度に100件まで取得。(多分100件で十分)
    let response = UrlFetchApp.fetch(this.base+'/sections/'+section_id+'/tasks?limit=100', {'headers':this.headers})
    // タスク詳細を取得
    let json_data = JSON.parse(response)
    let task_ids = json_data['data'].map((obj)=>obj.gid)
    return task_ids
  }

  // 期限超過タスクを取得する
  getOverDueTask(section_id){
    // 特定のセクションにあるタスクを取得
    const ids = this.getTaskBySection(section_id)
    // 期限超過しているタスクのIDを取得する
    const overDueTaskIds = ids.filter(id=>{
      let response = UrlFetchApp.fetch(this.base+'/tasks/'+id+'?opt_fields=completed,due_at',{'headers':this.headers})
      if(response === undefined) return false
      let json_data = JSON.parse(response).data
      if (json_data.due_at === null) return false
      let due_at = new Date(json_data.due_at)
      let now_at = new Date()
      if (json_data.completed === false && due_at.getTime()<now_at.getTime()) {
        return true
      }
    })
    return overDueTaskIds
  }

  // 完了タスクを取得する
  getCompletedTask(section_id){
    // 特定のセクションにあるタスクを取得
    const ids = this.getTaskBySection(section_id)
    // 期限超過しているタスクのIDを取得する
    const completedTaskIds = ids.filter(id=>{
      let response = UrlFetchApp.fetch(this.base+'/tasks/'+id+'?opt_fields=completed',{'headers':this.headers})
      if(response === undefined) return false
      let json_data = JSON.parse(response).data
      if (json_data.completed === true) {
        return true
      }
    })
    return completedTaskIds
  }

  // 指定したタスクのセクションを移動させる
  changeStatus(task_id,section_id){
    let data = {
      'data': {
        'task': task_id
      }
    }
    let options = {
      'headers': this.headers, 
      'method': 'post',
      'payload': JSON.stringify(data),
    }
    UrlFetchApp.fetch(this.base+'/sections/'+section_id+'/addTask', options)
  }

  // 指定したタスクを削除する
  removeTask(task_id){
    let options = {
      'headers': this.headers, 
      'method': 'delete',
    }
    UrlFetchApp.fetch(this.base+'/tasks/'+task_id, options)
  }

}