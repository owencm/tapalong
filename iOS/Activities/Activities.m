    //
//  Activities.m
//  Activities
//
//  Created by Owen Campbell-Moore on 9/30/13.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "Activities.h"
#import "GlobalNetwork.h"

@implementation Activities

- (id)init
{
    self = [super init];
    if (self) {
        activitiesArray = [[NSMutableArray alloc] init];
        listenersSet = (NSMutableSet<ActivitiesListener>*)[[NSMutableSet alloc] init];
//        [self addDummyEvents];
        [self updateActivitiesFromServer];
    }
    return self;
}

- (void) updateActivitiesFromServer {
    [[GlobalNetwork sharedGlobal] getActivities:^(NSArray *result)
      {
          activitiesArray = [result mutableCopy];
          [self notifyListenersActivitiesChanged];
      }
    ];
}

- (void) addDummyEvents {
    Activity *a = [[Activity alloc] init];
    a.title = @"Walking the dog";
    a.start_time = [NSDate date];
    [activitiesArray addObject:a];
}

// This can be called from anywhere and attempts to add the activity locally and on the server. TODO: respond with a success or fail message.
- (void) addActivity: (Activity*)activity {
    // Send a request to the server to create the new activity. Currently ignore the response and add it locally hoping all was well.... because success callbacks are for losers.
    [[GlobalNetwork sharedGlobal] createActivity:activity];
    [activitiesArray addObject:activity];
    [self notifyListenersActivitiesChanged];
}

- (void) addListener: (id<ActivitiesListener>)listener{
    [listenersSet addObject:listener];
    [self notifyListenersActivitiesChanged];
}

- (void) notifyListenersActivitiesChanged {
    for (id<ActivitiesListener>listener in listenersSet) {
        [listener activitiesChanged];
    }
}

// This returns the number of activities in the future
- (NSInteger) upcomingCount {
    return [activitiesArray count];
}

// This returns the nth next upcoming activity (chronologically increasing)
- (Activity*) activityAtIndex:(NSInteger)index {
    return [activitiesArray objectAtIndex:index];
}

@end
