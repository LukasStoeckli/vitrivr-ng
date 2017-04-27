import {Component} from '@angular/core';
import {MediaObjectScoreContainer} from "../shared/model/features/scores/media-object-score-container.model";
import {QueryService} from "../core/queries/query.service";
import {Router} from "@angular/router";
import {MediaObject} from "../shared/model/media/media-object.model";
import {ResolverService} from "../core/basics/resolver.service";
import {SegmentScoreContainer} from "../shared/model/features/scores/segment-score-container.model";

@Component({
    moduleId: module.id,
    selector: 'gallery',
    templateUrl: 'gallery.component.html',
    styleUrls: ['gallery.component.css']
})


export class GalleryComponent {

    /** List of MediaObjectScoreContainers currently displayed by the gallery. */
    private _mediaobjects : MediaObjectScoreContainer[];

    private _focus: MediaObjectScoreContainer;

    /**
     * Default constructor.
     *
     * @param _queryService
     * @param _resolver
     * @param _router
     */
    constructor(private _queryService : QueryService, private _resolver: ResolverService, private _router: Router) {
        _queryService.observable()
            .filter(msg => (msg == "UPDATED"))
            .subscribe((msg) => this.onQueryStateChange());

        if (_queryService.size() > 0) {
            this.updateGallery();
        }
    }

    /**
     *
     * @return {MediaObjectScoreContainer[]}
     */
    get mediaobjects(): MediaObjectScoreContainer[] {
        return this._mediaobjects;
    }


    /**
     * Sets the focus to the provided MediaObjectScoreContainer.
     *
     * @param focus
     */
    public setFocus(focus: MediaObjectScoreContainer) {
        this._focus = focus;
    }

    /**
     * Returns true, if the provided MediaObjectScoreContainer is currently
     * in focus and false otherwise.
     *
     * @param mediaobject
     * @return {boolean}
     */
    public inFocus(mediaobject: MediaObjectScoreContainer) {
        return this._focus == mediaobject;
    }

    /**
     * Invoked whenever the QueryService reports that the results were updated. Causes
     * the gallery to be re-rendered.
     */
    private onQueryStateChange() {
        this.updateGallery();
    }

    /**
     * Triggered whenever a user clicks on the object details button. Triggers a
     * transition to the ObjectdetailsComponent.
     *
     * @param object MediaObject for which details should be displayed.
     */
    private onDetailsButtonClicked(object: MediaObject) {
        this._router.navigate(['/mediaobject/' + object.objectId]);
    }


    /**
     * Triggered whenever a user clicks on the MLT (= MoreLikeThis) button. Triggers
     * a MLT query with the QueryService.
     *
     * @param segment SegmentScoreContainer which should be used for MLT.
     */
    public onMltButtonClicked(segment: SegmentScoreContainer) {
       this._queryService.findMoreLikeThis(segment.segmentId);
    }

    /**
     * This method is used internally to update the gallery view.
     */
    private updateGallery() {
        let cache : MediaObjectScoreContainer[] = [];
        this._queryService.forEach(function(value : MediaObjectScoreContainer, key : string) {
            if (value.show()) cache.push(value)
        });
        if (cache.length > 1) {
            cache.sort((a : MediaObjectScoreContainer,b : MediaObjectScoreContainer) => MediaObjectScoreContainer.compareAsc(a,b))
        }
        this._mediaobjects = cache;
    }
}