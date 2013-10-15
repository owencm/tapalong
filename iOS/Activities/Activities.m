//
//  Activities.m
//  Activities
//
//  Created by Owen Campbell-Moore on 9/30/13.
//  Copyright (c) 2013 A&O. All rights reserved.
//
//  This class is the Activities model for the app. It encapsulates storing data persistently and on the server. It notifies consumers of data changes via the (Roll-Your-Own(TM)) listener pattern.
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
        // It makes sense to call this here but activities is initialised before we login so wait for the doneLogIn call
        //        [self updateActivitiesFromServerInternal];
    }
    return self;
}


#pragma External methods

// This attempts to add the activity locally and on the server. TODO: respond with a success or fail message.
- (void) addActivity: (Activity*)activity {
    // Send a request to the server to create the new activity. Currently ignore the response and add it locally hoping all was well.... because success callbacks are for losers.
    [network createActivity:activity];
    [self addActivitiesFromArrayInternal:[NSArray arrayWithObject:activity]];
}

// This attempts to remove the activity locally and on the server. TODO: respond with a success or fail message.
- (void) removeActivity: (Activity*)activity {
    // Send a request to the server to remove the new activity. Currently ignore the response and add it locally hoping all was well.... because success callbacks are for losers.
    [network removeActivity:activity];
    [self removeActivitiesFromArrayInternal:[NSArray arrayWithObject:activity]];
}

// This returns the nth next upcoming activity (chronologically increasing)
- (Activity*) activityAtIndex:(NSInteger)index {
    return [activitiesArray objectAtIndex:index];
}

// This returns the number of activities in the future
- (NSInteger) upcomingCount {
    return [activitiesArray count];
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

- (void) doneLogIn {
    [self updateActivitiesFromServerInternal];
}



#pragma Internal methods

- (void) updateActivitiesFromServerInternal {
    [network getActivities:^(NSArray *result)
      {
          [self addActivitiesFromArrayInternal:[result copy]];
      }
    ];
}

- (void) addDummyEvents {
    Activity *a = [[Activity alloc] init];
    a.title = @"Walking the dog";
    a.start_time = [[NSDate date] dateByAddingTimeInterval:100000];
    a.description = @"Meet at the lighthouse Meet at the lighthouse Meet at the lighthouse Meet at the lighthouse Meet at the lighthouse Meet at the lighthouse ";
    a.location = @"Roath park lake roath roath roath roath roath";
    [self addActivitiesFromArrayInternal:[NSArray arrayWithObject:a]];
}

// This doesn't post new activities to the network, it is the internal implementation of adding activities to the internal array and checking consistency
- (void) addActivitiesFromArrayInternal:(NSArray *)newActivities {
    [activitiesArray addObjectsFromArray:newActivities];
    [self makeConsistent];
    [self notifyListenersActivitiesChanged];
}

// This doesn't post remove requests activities to the network, it is the internal implementation of removing activities from the internal array and checking consistency
- (void) removeActivitiesFromArrayInternal:(NSArray *)newActivities {
    [activitiesArray removeObjectsInArray:newActivities];
    [self makeConsistent];
    [self notifyListenersActivitiesChanged];
}

- (void) makeConsistent {
//    [self removePastActivitiesInternal];
    [self sortActivitiesInternal];
}

- (void) removePastActivitiesInternal {
    NSInteger index = 0;
    // Move through, removing or leaving each activity until there are none in the past
    while (index < [activitiesArray count]) {
        Activity *activity = [activitiesArray objectAtIndex:index];
        // Get a date representing right now that we can compare to the activity
        NSDate *now = [NSDate date];
        // If the activity happened in the past
        if ([now compare:activity.start_time] == NSOrderedDescending) {
            [activitiesArray removeObjectAtIndex:index];
        } else {
            index++;
        }
    }
}

- (void) sortActivitiesInternal {
    NSSortDescriptor *sortDescriptor = [[NSSortDescriptor alloc] initWithKey:@"start_time" ascending:FALSE];
    [activitiesArray sortUsingDescriptors:[NSArray arrayWithObject:sortDescriptor]];
}

@end
