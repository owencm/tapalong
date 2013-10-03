//
//  GlobalNetwork.h
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//
//

#import <Foundation/Foundation.h>
#import "Activity.h"
#import <RestKit/RestKit.h>

// A good guide on blocks: http://pragmaticstudio.com/blog/2010/9/15/ios4-blocks-2
typedef void (^GetActivitiesCallbackBlock)(NSArray *);

@interface Network : NSObject {
    RKObjectMapping *activityMapping;
    RKObjectManager *manager;
}

- (void) getActivities:(GetActivitiesCallbackBlock) successHandler;
- (void) createActivity:(Activity *) activity;
- (void) removeActivity:(Activity *) activity;

@end

