import NotifyData from "./NotifyData.js";
import { Component } from "../Component/WebComponent.js";

export default class {
  /**
   * @type {NotifyData[]}
   */
  queue = [];
  /**
   * @type {Component}
   */
  component;

  /**
   * コンストラクタ
   * @param {Component} component 
   */
  constructor(component) {
    this.component = component;
  }
  
  /**
   * 更新通知データをキューに入れる
   * @param {NotifyData} notifyData 
   * @param {NotifyData[]?} queue 
   */
  enqueue(notifyData, queue = this.queue) {
    //notifyData.prop.startsWith("__") && (notifyData.prop = notifyData.prop.slice(2));
    queue.push(notifyData);
  }

  /**
   * プロパティの内容をDOMへ反映する
   * @param {NotifyData[]?} queue 
   */
  updateElements(queue = this.queue) {
    do {
      const notifications = queue.slice();
      if (notifications.length === 0) break;
      queue.splice(0);

      // コンポーネント毎に通知をまとめる
      /**
       * @type {Map<Component,NotifyData[]>}
       */
      const notificationsByComponent = new Map;
      notifications.forEach(notification => {
        if (!notificationsByComponent.has(notification.component)) {
          notificationsByComponent.set(notification.component, []);
        }
        const notifications = notificationsByComponent.get(notification.component);
        notifications.push(notification);
      });

      // 通知に一致するプロパティをDOMへ反映する
      for(let [component, notifications] of notificationsByComponent.entries()) {
        const viewModelProxy = component?.viewModelProxy;
        // リストの要素の場合、関連するプロパティは削除する
        /**
         * @type {Set<string>}
         */
        const setOfArrayProps = viewModelProxy?.$setOfArrayProps ?? new Set;
        /**
         * @type {Map<string,string[]>}
         */
        const setOfRelativePropsByProp = viewModelProxy?.$setOfRelativePropsByProp ?? new Set;
        /**
         * @type {Set<NotifyData>}
         */
        const setOfRemoveNotifications = new Set;
        for(const notification of notifications) {
          if (!setOfArrayProps.has(notification.prop)) continue;
          const setOfRelativeProp = setOfRelativePropsByProp[notification.prop] ?? new Set;
          for(const relateNotification of notifications) {
            if (!setOfRelativeProp.has(relateNotification.prop)) continue;
            setOfRemoveNotifications.add(relateNotification);
          }
        }
        notifications = notifications.filter(notification => !setOfRemoveNotifications.has(notification));
        
        if ("$onNotify" in viewModelProxy ?? []) {
          const addNotifications = 
            Array.from(notifications)
              .flatMap(notification => viewModelProxy.$onNotify(notification))
              .filter(notification => notification != null)
              .map(notification => new NotifyData(component, notification.prop, notification?.indexes));
          notifications.push(...addNotifications);
        }

        // リストの要素でない場合、関連するプロパティは追加する
        /**
         * @type {NotifyData[]}
         */
        const addRelativeNotifications = [];
        for(const notification of notifications) {
          if (setOfArrayProps.has(notification.prop)) continue;
          const setOfRelativeProp = setOfRelativePropsByProp.get(notification.prop) ?? new Set;
          addRelativeNotifications.push(...Array.from(setOfRelativeProp).map(prop => new NotifyData(component, prop, notification?.indexes))) ;
        }
        notifications.push(...addRelativeNotifications);

        const setOfNotifications = new Set(notifications.map(notification => notification.path));
        viewModelProxy.$deleteCache(setOfNotifications);
        //console.log(component.tagName, Array.from(setOfNotifications).join(","));
        component.binder.update(setOfNotifications, new Set);
      }    
  
    } while(true);
  }
}
/**
listの場合、
list.*
list.*.id
list.*.label
list.*.selected
は再構築されるので、notifyに含みたくない

list.*, [0]の場合
list.*.id, [0]
list.*.label, [0]
list.*.selected, [0]
をnotifyに含みたい

list
ViewModelにlist.*が存在すれば、配列とみなす
配列の場合、notifyからlist.*.で始まるものは削除

list.*
ViewModelにlist.*.*が存在すれば、配列とみなす
配列でない場合、notifyにlist.*.で始まるものを追加

 */