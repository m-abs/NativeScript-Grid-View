/*! *****************************************************************************
Copyright (c) 2017 Tangra Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
***************************************************************************** */

import { Length, View, layout } from "ui/core/view";

import {
    GridViewBase,
    colWidthProperty,
    orientationProperty,
    paddingBottomProperty,
    paddingLeftProperty,   
    paddingRightProperty,
    paddingTopProperty,
    rowHeightProperty,
} from "./grid-view-common";

import { GridItemEventData, Orientation } from ".";

export * from "./grid-view-common";

export class GridView extends GridViewBase {
    public nativeView: GridViewRecyclerView;
    public _realizedItems = new Map<android.view.View, View>();

    public createNativeView() {
        const recyclerView = new GridViewRecyclerView(this._context, new WeakRef(this));

        const adapter = new GridViewAdapter(new WeakRef(this));
        adapter.setHasStableIds(true);
        recyclerView.setAdapter(adapter);

        const orientation = this._getLayoutManagarOrientation();

        const layoutManager = new android.support.v7.widget.LinearLayoutManager(this._context, orientation, false);
        recyclerView.setLayoutManager(layoutManager);
        layoutManager.setOrientation(orientation);

        const scrollListener = new GridViewScrollListener(new WeakRef(this));
        recyclerView.addOnScrollListener(scrollListener);

        return recyclerView;
    }

    public initNativeView() {
        super.initNativeView();

        const nativeView = this.nativeView;
        nativeView.adapter.owner = new WeakRef(this);
        nativeView.scrollListener.owner = new WeakRef(this);
        nativeView.owner = new WeakRef(this);

        colWidthProperty.coerce(this);
        rowHeightProperty.coerce(this);
    }

    public disposeNativeView() {
        // clear the cache
        this.eachChildView((view) => {
            view.parent._removeView(view);
            return true;
        });
        this._realizedItems.clear();

        const nativeView = this.nativeView;
        this.nativeView.removeOnScrollListener(nativeView.scrollListener);

        nativeView.scrollListener = null;
        nativeView.adapter = null;
        nativeView.layoutManager = null;

        super.disposeNativeView();
    }

    get android(): android.support.v7.widget.RecyclerView {
        return this.nativeView;
    }

    get _childrenCount(): number {
        return this._realizedItems.size;
    }

    public [paddingTopProperty.getDefault](): number {
        return ((this.nativeView as any) as android.view.View).getPaddingTop();
    }
    public [paddingTopProperty.setNative](value: Length) {
        this._setPadding({ top: this.effectivePaddingTop });
    }

    public [paddingRightProperty.getDefault](): number {
        return ((this.nativeView as any) as android.view.View).getPaddingRight();
    }
    public [paddingRightProperty.setNative](value: Length) {
        this._setPadding({ right: this.effectivePaddingRight });
    }

    public [paddingBottomProperty.getDefault](): number {
        return ((this.nativeView as any) as android.view.View).getPaddingBottom();
    }
    public [paddingBottomProperty.setNative](value: Length) {
        this._setPadding({ bottom: this.effectivePaddingBottom });
    }

    public [paddingLeftProperty.getDefault](): number {
        return ((this.nativeView as any) as android.view.View).getPaddingLeft();
    }
    public [paddingLeftProperty.setNative](value: Length) {
        this._setPadding({ left: this.effectivePaddingLeft });
    }

    public [orientationProperty.getDefault](): Orientation {
        const layoutManager = this.nativeView.getLayoutManager() as android.support.v7.widget.GridLayoutManager;
        if (layoutManager.getOrientation() === android.support.v7.widget.LinearLayoutManager.HORIZONTAL) {
            return "horizontal";
        }

        return "vertical";
    }
    public [orientationProperty.setNative](value: Orientation) {
        const layoutManager = this.nativeView.getLayoutManager() as android.support.v7.widget.GridLayoutManager;
        if (value === "horizontal") {
            layoutManager.setOrientation(android.support.v7.widget.LinearLayoutManager.HORIZONTAL);
        } else {
            layoutManager.setOrientation(android.support.v7.widget.LinearLayoutManager.VERTICAL);
        }
    }

    public eachChildView(callback: (child: View) => boolean): void {
        this._realizedItems.forEach((view, key) => {
            callback(view);
        });
    }

    public onLayout(left: number, top: number, right: number, bottom: number) {
        super.onLayout(left, top, right, bottom);
        this.refresh();
    }

    public refresh() {
        if (!this.nativeView || !this.nativeView.getAdapter()) {
            return;
        }

        const layoutManager = this.nativeView.getLayoutManager() as android.support.v7.widget.GridLayoutManager;
        let spanCount: number;

        if (this.orientation === "horizontal") {
          spanCount = Math.max(Math.floor(this._innerHeight / this._effectiveRowHeight), 1) || 1;
        } else {
          spanCount = Math.max(Math.floor(this._innerWidth / this._effectiveColWidth), 1) || 1;
        }

        layoutManager.setSpanCount(spanCount);

        this.nativeView.getAdapter().notifyDataSetChanged();
    }

    public _getRealizedView(convertView: android.view.View) {
        if (!convertView) {
            return this._getItemTemplateContent();
        }

        return this._realizedItems.get(convertView);
    }

    public scrollToIndex(index: number) {
        this.nativeView.scrollToPosition(index);
    }

    public scrollTo(x: number, y: number) {
        this.nativeView.scrollTo(x, y);
    }

    public scrollBy(x: number, y: number) {
        this.nativeView.scrollBy(x, y);
    }
    
    private _setPadding(newPadding: { top?: number, right?: number, bottom?: number, left?: number }) {
        const nativeView: android.view.View = this.nativeView as any;
        const padding = {
            top: nativeView.getPaddingTop(),
            right: nativeView.getPaddingRight(), 
            bottom: nativeView.getPaddingBottom(),
            left: nativeView.getPaddingLeft()
        };
        // tslint:disable-next-line:prefer-object-spread
        const newValue = Object.assign(padding, newPadding);
        nativeView.setPadding(newValue.left, newValue.top, newValue.right, newValue.bottom);
    }

    private _getLayoutManagarOrientation() {
        let orientation = android.support.v7.widget.LinearLayoutManager.VERTICAL;
        if (this.orientation === "horizontal") {
            orientation = android.support.v7.widget.LinearLayoutManager.HORIZONTAL;
        }

        return orientation;
    }
}

class GridViewScrollListener extends android.support.v7.widget.RecyclerView.OnScrollListener {

    private _lastScrollX: number = -1;
    private _lastScrollY: number = -1;

    constructor(public owner: WeakRef<GridView>) {
        super();

        return global.__native(this);
    }

    public onScrolled(view: android.support.v7.widget.RecyclerView, dx: number, dy: number) {
        const owner: GridView = this.owner.get();
        if (!owner) {
            return;
        }
        const layoutManager = view.getLayoutManager() as android.support.v7.widget.GridLayoutManager;

        const scrollX = view.computeHorizontalScrollOffset();
        const scrollY = view.computeVerticalScrollOffset();

        const firstVisibleItemPos = layoutManager.findFirstCompletelyVisibleItemPosition();
        const lastVisibleItemPos = layoutManager.findLastCompletelyVisibleItemPosition();
        const itemCount = owner.items.length - 1;
        if (lastVisibleItemPos === itemCount) {
            owner.notify({
                eventName: GridViewBase.loadMoreItemsEvent,
                object: owner
            });
        }

        if (scrollX !== this._lastScrollX || scrollY !== this._lastScrollY) {
          owner.notify({
            object: owner,
            eventName: "scroll",
            scrollX: scrollX / layout.getDisplayDensity(),
            scrollY: scrollY / layout.getDisplayDensity(),
            firstVisibleItemPos,
            lastVisibleItemPos,
            itemCount,
          });

          this._lastScrollX = scrollX;
          this._lastScrollY = scrollY;
        }
    }

    public onScrollStateChanged(view: android.support.v7.widget.RecyclerView, newState: number) {
        // Not Needed
    }
}

@Interfaces([android.view.View.OnClickListener])
class GridViewCellHolder extends android.support.v7.widget.RecyclerView.ViewHolder implements android.view.View.OnClickListener {
    constructor(public owner: WeakRef<View>, private gridView: WeakRef<GridView>) {       
        super(owner.get().android);

        const nativeThis = global.__native(this);
        const nativeView = owner.get().android as android.view.View;
        nativeView.setOnClickListener(nativeThis);

        return nativeThis;
    }

    get view(): View {
        return this.owner ? this.owner.get() : null;
    }

    public onClick(v: android.view.View) {
        const gridView = this.gridView.get();

        gridView.notify<GridItemEventData>({
            eventName: GridViewBase.itemTapEvent,
            object: gridView,
            index: this.getAdapterPosition(),
            view: this.view
        });            
    }
    
}

class GridViewAdapter extends android.support.v7.widget.RecyclerView.Adapter {
    constructor(public owner: WeakRef<GridView>) {
        super();
        
        return global.__native(this);
    }

    public getItemCount() {
        const owner = this.owner.get();
        return owner.items ? owner.items.length : 0;
    }

    public getItemId(i: number) {
        return long(i);
    }

    public onCreateViewHolder(parent: android.view.ViewGroup, viewType: number): android.support.v7.widget.RecyclerView.ViewHolder{
        const owner = this.owner.get();
        const view = owner._getItemTemplateContent();

        owner._addView(view);

        owner._realizedItems.set(view.android, view);

        return new GridViewCellHolder(new WeakRef(view), new WeakRef(owner));
    }

    public onBindViewHolder(vh: GridViewCellHolder, index: number) {
        const owner = this.owner.get();

        owner.notify<GridItemEventData>({
            eventName: GridViewBase.itemLoadingEvent,
            object: owner,
            index,
            view: vh.view
        });
        
        owner._prepareItem(vh.view, index);
    }    
}

class GridViewRecyclerView extends android.support.v7.widget.RecyclerView {
    public adapter: GridViewAdapter;
    public layoutManager: android.support.v7.widget.LinearLayoutManager;
    public scrollListener: GridViewScrollListener;

    constructor(context: android.content.Context, public  owner: WeakRef<GridView>) {
        super(context);

        return global.__native(this);
    }

    public onLayout(changed: boolean, l: number, t: number, r: number, b: number) {
        if (changed) {
            const owner = this.owner.get();
            owner.onLayout(l, t, r, b);
        }    
        super.onLayout(changed, l, t, r, b);
    }
    
    public setAdapter(adapter: GridViewAdapter) {
        super.setAdapter(adapter);
        this.adapter = adapter;
    }

    public setLayoutManager(layoutManager: android.support.v7.widget.LinearLayoutManager) {
        super.setLayoutManager(layoutManager);
        this.layoutManager = layoutManager;
    }

    public addOnScrollListener(scrollListener: GridViewScrollListener) {
        super.addOnScrollListener(scrollListener);
        this.scrollListener = scrollListener;
    }

    public removeOnScrollListener(scrollListener: GridViewScrollListener) {
        super.removeOnScrollListener(scrollListener);
        this.scrollListener = null;
    }

    public scrollTo(x: number, y: number) {
        const oldX = this.computeHorizontalScrollOffset();
        const oldY = this.computeVerticalScrollOffset();

        const deltaX = x - oldX;
        const deltaY = y - oldY;

        console.dir({
          deltaX,
          deltaY,
          oldX,
          oldY,
          x,
          y,
        });

        this.scrollBy(deltaX, deltaY);
    }
}
