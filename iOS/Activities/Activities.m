//
//  Activities.m
//  Activities
//
//  Created by Owen Campbell-Moore on 9/30/13.
//  Copyright (c) 2013 A&O. All rights reserved.
//
//  This class is the Activities model for the app. It encapsulates storing data persistently and on the server. It notifies consumers of data changes via the (Roll-Your-Own(TM)) listener pattern.
//  TODO: Only show activities happening in the future
//

#import "AppDelegate.h"
#import "Activities.h"
#import "Network.h"

@implementation Activities

- (id)initWithNetwork:(Network*)theNetwork
{
    self = [super init];
    if (self) {
        network = theNetwork;
        activitiesArray = [[NSMutableArray alloc] init];
        listenersSet = (NSMutableSet<ActivitiesListener>*)[[NSMutableSet alloc] init];
        [self addDummyEvents];
        [self updateActivitiesFromServer];
    }
    return self;
}

- (void) updateActivitiesFromServer {
    [network getActivities:^(NSArray *result)
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
    a.description = @"Meet at the lighthouse Meet at the lighthouse Meet at the lighthouse Meet at the lighthouse Meet at the lighthouse Meet at the lighthouse ";
    a.location = @"Roath park lake";
    [activitiesArray addObject:a];
}

// This can be called from anywhere and attempts to add the activity locally and on the server. TODO: respond with a success or fail message.
- (void) addActivity: (Activity*)activity {
    // Send a request to the server to create the new activity. Currently ignore the response and add it locally hoping all was well.... because success callbacks are for losers.
    [network createActivity:activity];
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
