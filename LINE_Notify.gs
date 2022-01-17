class LINE_notify {
  constructor(){
    let access_token = PropertiesService.getScriptProperties().getProperty('LINE_NOTIFY_ACCESS_TOKEN')
    let headers = {'Authorization':`Bearer ${access_token}`}
    this.options = {'headers': headers, 'method': 'post'}
    this.base = 'https://notify-api.line.me/api/notify'
  }

  call(message){
    let options = this.options
    options['payload'] = {'message':message}
    UrlFetchApp.fetch(this.base, options) 
  }
}