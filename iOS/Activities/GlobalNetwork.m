//
//  GlobalNetwork.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <RestKit/RestKit.h>
#import "GlobalNetwork.h"
#import "Activity.h"

static GlobalNetwork *sharedGlobalInstance = nil;

@implementation GlobalNetwork

#pragma mark Singleton Methods
+ (id)sharedGlobal {
    @synchronized(self) {
        if (sharedGlobalInstance == nil)
            sharedGlobalInstance = [[self alloc] init];
    }
    return sharedGlobalInstance;
}

- (id)init {
    if (self = [super init]) {
        // Set properties required in here
    }
    return self;
}

- (void)getActivities:(GetActivitiesCallbackBlock) successCallback
{
    // Store a copy of the success callback
    GetActivitiesCallbackBlock _successCallback = [successCallback copy];
    
    // Define the object mapping 
    RKObjectMapping *activityMapping = [RKObjectMapping mappingForClass:[Activity class]];
    [activityMapping addAttributeMappingsFromDictionary:@{
         @"title": @"title",
         @"start_time": @"start_time",
         @"location": @"location",
         @"max_attendees": @"max_attendees",
         @"description": @"description"
     }];
    
    // This defines a key path for {activity: {...}} objects, connecting activity objects with the activityMapping
    RKResponseDescriptor *responseDescriptor = [RKResponseDescriptor responseDescriptorWithMapping:activityMapping pathPattern:nil keyPath:@"activity" statusCodes:RKStatusCodeIndexSetForClass(RKStatusCodeClassSuccessful)];
    
    // Set up the request
    NSURL *URL = [NSURL URLWithString:@"http://127.0.0.1:8000/activities/1/"];
    NSURLRequest *request = [NSURLRequest requestWithURL:URL];
    
    // Associate the descriptor with the request
    RKObjectRequestOperation *objectRequestOperation = [[RKObjectRequestOperation alloc] initWithRequest:request responseDescriptors:@[ responseDescriptor ]];
    
    // Set the success and failure callbacks, forwarding the success to successCallback
    [objectRequestOperation setCompletionBlockWithSuccess:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
        // Call success callback with returned data!
        _successCallback(mappingResult.array);
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        RKLogError(@"Operation failed with error: %@", error);
    }];
    
    [objectRequestOperation start];
}



@end
