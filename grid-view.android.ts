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

import { KeyedTemplate, Length, View, layout } from "ui/core/view";

import {
    GridViewBase,
    colWidthProperty,
    itemTemplatesProperty,
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
    public readonly _realizedItems = new Map<android.view.View, View>();

    private get layoutManager() {
        return this.nativeView.layoutManager;
    }

    public createNativeView() {
        const recyclerView = new GridViewRecyclerView(this._context, new WeakRef(this));

        const adapter = new GridViewAdapter(new WeakRef(this));
        adapter.setHasStableIds(true);
        recyclerView.setAdapter(adapter);

        const orientation = this._getLayoutManagarOrientation();
        const layoutManager = new android.support.v7.widget.GridLayoutManager(this._context, 1, orientation, false);
        recyclerView.setLayoutManager(layoutManager);

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

    public get android(): GridViewRecyclerView {
        return this.nativeView;
    }

    public get _childrenCount(): number {
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
        const layoutManager = this.layoutManager;
        if (layoutManager.getOrientation() === android.support.v7.widget.GridLayoutManager.HORIZONTAL) {
            return "horizontal";
        }

        return "vertical";
    }
    public [orientationProperty.setNative](value: Orientation) {
        const layoutManager = this.layoutManager;
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

    public [itemTemplatesProperty.getDefault](): KeyedTemplate[] {
        return null;
    }
    public [itemTemplatesProperty.setNative](value: KeyedTemplate[]) {
        this._itemTemplatesInternal = new Array<KeyedTemplate>(this._defaultTemplate);
        if (value) {
            this._itemTemplatesInternal = this._itemTemplatesInternal.concat(value);
        }

        const adapter = new GridViewAdapter(new WeakRef(this));
        adapter.setHasStableIds(true);
        this.nativeView.setAdapter(adapter);
        this.refresh();
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
        let orientation = android.support.v7.widget.GridLayoutManager.VERTICAL;
        if (this.orientation === "horizontal") {
            orientation = android.support.v7.widget.GridLayoutManager.HORIZONTAL;
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

    public onScrolled(view: GridViewRecyclerView, dx: number, dy: number) {
        const owner: GridView = this.owner.get();
        if (!owner) {
            return;
        }
        const layoutManager = view.getLayoutManager();

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

    public onScrollStateChanged(view: GridViewRecyclerView, newState: number) {
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

    public onCreateViewHolder(parent: android.view.ViewGroup, viewType: number): android.support.v7.widget.RecyclerView.ViewHolder {
        const owner = this.owner.get();
        const view = owner._getItemTemplateContent(viewType);

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

    public getItemViewType(index: number): number {
        const template = this.owner.get()._getItemTemplate(index);
        return this.owner.get()._itemTemplatesInternal.indexOf(template);
    }
}

class GridViewRecyclerView extends android.support.v7.widget.RecyclerView {
    public adapter: GridViewAdapter;
    public layoutManager: android.support.v7.widget.GridLayoutManager;
    public scrollListener: GridViewScrollListener;

    constructor(context: android.content.Context, public owner: WeakRef<GridView>) {
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

    public getLayoutManager(): android.support.v7.widget.GridLayoutManager {
        return super.getLayoutManager() as android.support.v7.widget.GridLayoutManager;
    }

    public setLayoutManager(layoutManager: android.support.v7.widget.GridLayoutManager) {
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

    /**
     * The scrollTo(x, y)-function on android.support.v7.widget.RecyclerView doesn't work, this implements it by using scrollBy(x, y);
     */
    public scrollTo(x: number, y: number) {
        const oldX = this.computeHorizontalScrollOffset();
        const oldY = this.computeVerticalScrollOffset();

        const deltaX = x - oldX;
        const deltaY = y - oldY;

        this.scrollBy(deltaX, deltaY);
    }
}
