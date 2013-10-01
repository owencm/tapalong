    //
//  Activities.m
//  Activities
//
//  Created by Owen Campbell-Moore on 9/30/13.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "Activities.h"

@implementation Activities

- (id)init
{
    self = [super init];
    if (self) {
        activitiesArray = [[NSMutableArray alloc] init];
        Activity *a = [[Activity alloc] init];
        a.title = @"Walking the dog";
        a.start_time = [NSDate date];
        [activitiesArray addObject:a];
    }
    return self;
}

- (void) addActivity: (Activity*)activity {
    
}

- (void) addListener: (id<ActivitiesListener>)listener{
    [self->listenersArray addObject:listener];
    [listener activitiesChanged];
}

- (void) notifyListenersActivitiesChanged {
    for (id<ActivitiesListener>listener in self->listenersArray) {
        [listener activitiesChanged];
    }
}

- (NSInteger) upcomingCount {
    return [activitiesArray count];
}

- (Activity*) activityAtIndex:(NSInteger)index {
    return [activitiesArray objectAtIndex:index];
}

//
//// Download activities from the server and display them
//[[GlobalNetwork sharedGlobal] getActivities:^(NSArray *result)
// {
//     self.activities = [result mutableCopy];
//     [[self tableView] reloadData];
// }
// ];

@end
