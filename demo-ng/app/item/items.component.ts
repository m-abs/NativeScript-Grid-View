import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { GridView } from 'nativescript-grid-view';

import { Item } from "./item";
import { ItemService } from "./item.service";

@Component({
    selector: "ns-items",
    moduleId: module.id,
    templateUrl: "./items.component.html",
})
export class ItemsComponent implements OnInit {
    items: Item[];

    @ViewChild('scroll1') public _scroll1: ElementRef;
    get scroll1(): GridView {
        if (this._scroll1) {
            return this._scroll1.nativeElement;
        }
    }

    @ViewChild('scroll2') public _scroll2: ElementRef;
    get scroll2(): GridView {
        if (this._scroll2) {
            return this._scroll2.nativeElement;
        }
    }

    // This pattern makes use of Angular’s dependency injection implementation to inject an instance of the ItemService service into this class. 
    // Angular knows about this service because it is included in your app’s main NgModule, defined in app.module.ts.
    constructor(private itemService: ItemService) { }

    ngOnInit(): void {
        this.items = this.itemService.getItems();
    }

    onScroll(event: any) {
        for (const key of Object.keys(event)) {
            console.log(`${key} = ${event[key]}`);
        }
    }

    scrollTo1() {
        const scrollView = this.scroll1;
        if (!scrollView) {
            return;
        }

        scrollView.scrollToIndex(10);
    }

    scrollTo2() {
        const scrollView = this.scroll2;
        if (!scrollView) {
            return;
        }

        scrollView.scrollToIndex(10);
    }

    itemTemplateSelector(item: any, index: number, items: Array<any>) {
        return index % 2 ? 'even' : 'odd';
    }
}
