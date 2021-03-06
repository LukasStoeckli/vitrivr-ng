import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {CineastAPI} from "../api/cineast-api.service";
import {Message} from "../../shared/model/messages/interfaces/message.interface";
import {QueryStart} from "../../shared/model/messages/interfaces/query-start.interface";
import {SegmentQueryResult} from "../../shared/model/messages/interfaces/query-result-segment.interface";
import {SimilarityQueryResult} from "../../shared/model/messages/interfaces/query-result-similarty.interface";
import {ObjectQueryResult} from "../../shared/model/messages/interfaces/query-result-object.interface";
import {SimilarityQuery} from "../../shared/model/messages/similarity-query.model";
import {MoreLikeThisQuery} from "../../shared/model/messages/more-like-this-query.model";
import {QueryError} from "../../shared/model/messages/interfaces/query-error.interface";
import {QueryContainer} from "../../shared/model/queries/query-container.model";
import {ResultsContainer} from "../../shared/model/features/scores/results-container.model";

/**
 *  Types of changes that can be emitted from the QueryService.
 *
 *  STARTED     - New query was started.
 *  ENDED       - Processing of the query has ended.
 *  UPDATED     - New information concerning the running query is available OR post-execution refinements were performed.
 *  FEATURE     - A new feature has become available.
 */
export type QueryChange = "STARTED" | "ENDED" | "ERROR" | "UPDATED" | "FEATURE" | "CLEAR";

/**
 * This service orchestrates similarity queries using the Cineast API (WebSocket). The service is responsible for
 * issuing findSimilar requests, processing incoming responses and ranking of the queries.
 */
@Injectable()
export class QueryService {
    /** Flag indicating whether a query is currently being executed. */
    private _running : boolean = false;

    /** Subject that allows Observers to subscribe to changes emitted from the QueryService. */
    private _subject : Subject<QueryChange> = new Subject();

    /** Results of a query. May be empty. */
    private _results: ResultsContainer;

    /**
     * Default constructor.
     *
     * @param _api Reference to the CineastAPI. Gets injected by DI.
     */
    constructor(private _api : CineastAPI) {
        _api.observable()
            .filter(msg => ["QR_START","QR_END","QR_ERROR","QR_SIMILARITY","QR_OBJECT","QR_SEGMENT"].indexOf(msg[0]) > -1)
            .subscribe((msg) => this.onApiMessage(msg[1]));
        console.log("QueryService is up and running!");
    }

    /**
     * Starts a new similarity query. Success is indicated by the return value.
     *
     * Note: Queries can only be started if no query is currently ongoing.
     *
     * @param query The SimilarityQueryMessage.
     * @returns {boolean} true if query was issued, false otherwise.
     */
    public findSimilar(query : SimilarityQuery) : boolean {
        if (!this._running) {
            this._api.send(query.toJson());
            return true;
        } else {
            return false;
        }
    }

    /**
     *
     * @param {string} dataUrl
     * @return {boolean}
     */
    public findByDataUrl(dataUrl: string) : boolean {

      let qq = new QueryContainer();
      qq.addTerm("IMAGE");
      qq.getTerm("IMAGE").data = dataUrl;
      qq.getTerm("IMAGE").setCategories(['quantized', 'localcolor', 'localfeatures', 'edge']);

      let query = new SimilarityQuery(
        [qq]
      );
      return this.findSimilar(query);
    }

    /**
     * Starts a new MoreLikeThis query. Success is indicated by the return value.
     *
     * Note: Queries can only be started if no query is currently ongoing.
     *
     * @param segmentId The ID of the segment that should serve as example.
     * @returns {boolean} true if query was issued, false otherwise.
     */
    public findMoreLikeThis(segmentId: string) : boolean {
        if (this._running) return false;
        if (this._results.features.length == 0) return false;

        let categories: string[] = [];
        for (let feature of this._results.features) {
            categories.push(feature.name);
        }

        this._api.send(new MoreLikeThisQuery(segmentId, categories));
        return true;
    }

    /**
     * Getter for results.
     *
     * @return {ResultsContainer}
     */
    get results(): ResultsContainer {
        return this._results;
    }

    /**
     * Getter for running.
     *
     * @return {boolean}
     */
    get running(): boolean {
        return this._running;
    }

    /**
     * Returns an Observable that allows an Observer to be notified about
     * state changes in the QueryService (RunningQueries, Finished, Resultset updated).
     *
     * @returns {Observable<QueryChange>}
     */
    get observable() : Observable<QueryChange>{
        return this._subject.asObservable();
    }

    /**
     * This is where the magic happens: Subscribes to messages from the underlying WebSocket and orchestrates the
     * assembly of the individual pieces of QueryResults.
     *
     * @param message
     */
    private onApiMessage(message: string): void {
        let parsed = <Message>JSON.parse(message);
        switch (parsed.messageType) {
            case "QR_START":
                let qs = <QueryStart>parsed;
                this.startNewQuery(qs.queryId);
                break;
            case "QR_OBJECT":
                let obj = <ObjectQueryResult>parsed;
                if (this._results && this._results.processObjectMessage(obj)) this._subject.next("UPDATED");
                break;
            case "QR_SEGMENT":
                let seg = <SegmentQueryResult>parsed;
                if (this._results && this._results.processSegmentMessage(seg)) this._subject.next("UPDATED");
                break;
            case "QR_SIMILARITY":
                let sim = <SimilarityQueryResult>parsed;
                if (this._results && this._results.processSimilarityMessage(sim)) this._subject.next("UPDATED");
                break;
            case "QR_ERROR":
                this.errorOccurred(<QueryError>parsed);
                break;
            case "QR_END":
                this.finalizeQuery();
                break;
        }
    }

    /**
     * Starts a new RunningQueries in response to a QR_START message. Stores the
     * queryId for further reference and purges the similarities and segment_to_object_map.
     *
     * This method triggers an observable change in the QueryService class.
     *
     * @param id ID of the new query. Used to associate responses.
     */
    private startNewQuery(id : string) {
        /* Start the actual query. */
        this._results = new ResultsContainer(id);
        this._running = true;
        this._subject.next("STARTED" as QueryChange);
    }

    /**
     * Finalizes a running RunningQueries and does some cleanup.
     *
     * This method triggers an observable change in the QueryService class.
     */
    private finalizeQuery() {
        this._running = false;
        this._subject.next("ENDED" as QueryChange);
    }

    /**
     * Finalizes a running RunningQueries and does some cleanup after an error was reported by Cineast.
     *
     * This method triggers an observable change in the QueryService class.
     */
    private errorOccurred(message: QueryError) {
        this._running = false;
        this._subject.next("ERROR" as QueryChange);
        console.log("QueryService received error: " + message.message);
    }

    /**
     * Clears the results and aborts the current query from being executed (Warning: The
     * abort is not propagated to the Cineast API, which might still be running).
     */
    public clear() {
        /* If query is still running, stop it. */
        if (this._running) {
            this._subject.next("ENDED" as QueryChange);
            this._running = false;
        }

        /* Complete the ResultsContainer and release it. */
        if (this._results) {
            this._results.complete();
            this._results = null;
        }

        /* Publish Event. */
        this._subject.next("CLEAR");
    }
}
