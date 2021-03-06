import {Pipe, PipeTransform} from "@angular/core";
import {SegmentScoreContainer} from "../../model/features/scores/segment-score-container.model";

@Pipe({
    name: 'OrderBySegmentPipe'
})
export class OrderBySegmentPipe implements PipeTransform {

    /**
     * Returns the provided array of SegmentScoreContainers sorted by temporal sequence of the segments.
     *
     * @param {Array<SegmentScoreContainer>} array
     * @param {string} args
     * @return {Array<SegmentScoreContainer>}
     */
    public transform(array: Array<SegmentScoreContainer>, desc: boolean = true): Array<SegmentScoreContainer> {
        if(!array || array === undefined || array.length === 0) return [];
        return array.slice().sort((a: SegmentScoreContainer, b: SegmentScoreContainer) => {
            if (desc) {
                return a.starttime - b.starttime;
            } else {
                return b.starttime - a.starttime;
            }
        });
    }
}