//
//  Activities.h
//  Activities
//
//  Created by Owen Campbell-Moore on 9/30/13.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Activity.h"
#import "ActivitiesListener.h"
#import "Network.h"

@interface Activities : NSObject {
    NSMutableArray *activitiesArray;
    NSMutableSet<ActivitiesListener> *listenersSet;
    Network *network;
}

- (Activities*) initWithNetwork: (Network*)theNetwork;
- (NSInteger) upcomingCount;
- (Activity*) activityAtIndex: (NSInteger)index;
- (void) addActivity: (Activity*)activity;
- (void) removeActivity: (Activity*)activity;
- (void) addListener: (id<ActivitiesListener>)listener;
- (void) doneLogIn;

@end
