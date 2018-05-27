"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeFrameSteps = {
    // 'S5': 5000,
    // 'S10': 10000,
    // 'S15': 15000,
    // 'S30': 30000,
    'M1': 60000,
    // 'M5': 300000,
    // 'M15': 900000,
    // 'M30': 1800000,
    'H1': 3600000,
    // 'H4': 14400000,
    'D': 86400000
};
function getEstimatedTimeFromCount(timeFrame, count) {
    return exports.timeFrameSteps[timeFrame] * count;
}
exports.getEstimatedTimeFromCount = getEstimatedTimeFromCount;
function splitToChunks(timeFrame, from, until, count, chunkLimit) {
    var timeStep = this.timeFrameSteps[timeFrame] * chunkLimit, returnArr = [];
    if (from && until) {
        while (from < until)
            returnArr.push({
                from: from,
                until: (from += timeStep) < until ? from : until
            });
    }
    else {
        while (count > 0) {
            returnArr.push({
                from: from,
                until: until,
                count: count >= chunkLimit ? chunkLimit : count
            });
            count -= chunkLimit;
        }
    }
    return returnArr;
}
exports.splitToChunks = splitToChunks;
// TODO: STOLEN FROM NPM MERGE-RANGES
function mergeRanges(ranges) {
    if (!(ranges && ranges.length))
        return [];
    // Stack of final ranges
    var stack = [];
    // Sort according to start value
    ranges.sort(function (a, b) {
        return a[0] - b[0];
    });
    // Add first range to stack
    stack.push(ranges[0]);
    ranges.slice(1).forEach(function (range, i) {
        var top = stack[stack.length - 1];
        if (top[1] < range[0]) {
            // No overlap, push range onto stack
            stack.push(range);
        }
        else if (top[1] < range[1]) {
            // Add bars counter
            top[2] += range[2];
            // Update previous range
            top[1] = range[1];
        }
    });
    return stack;
}
exports.mergeRanges = mergeRanges;
