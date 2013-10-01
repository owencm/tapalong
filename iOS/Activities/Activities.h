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

@interface Activities : NSObject {
    NSMutableArray *activitiesArray;
    NSMutableSet<ActivitiesListener> *listenersSet;
}

- (void) addActivity: (Activity*)activity;
- (void) addListener: (id<ActivitiesListener>)listener;
- (Activity*) activityAtIndex: (NSInteger)index;
- (NSInteger) upcomingCount;

@end
