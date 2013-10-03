//
//  GlobalNetwork.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <RestKit/RestKit.h>
#import "Network.h"
#import "Activity.h"

@implementation Network

- (id)init {
    if (self = [super init]) {
        // Initialise RestKit's manager
        manager = [RKObjectManager managerWithBaseURL:[NSURL URLWithString:@"http://127.0.0.1:8000"]];
        
        // Define the mapping from JSON to our model
        activityMapping = [RKObjectMapping mappingForClass:[Activity class]];
        [activityMapping addAttributeMappingsFromDictionary:@{
                                                              @"title": @"title",
                                                              @"start_time": @"start_time",
                                                              @"location": @"location",
                                                              @"max_attendees": @"max_attendees",
                                                              @"description": @"description"
                                                              }];
    }
    return self;
}

- (void)getActivities:(GetActivitiesCallbackBlock) successCallback
{
    // Store a copy of the success callback
    GetActivitiesCallbackBlock _successCallback = [successCallback copy];
    
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

- (void)createActivity:(Activity *)activity
{    
    RKRequestDescriptor *requestDescriptor = [RKRequestDescriptor requestDescriptorWithMapping:[activityMapping inverseMapping] objectClass:[Activity class] rootKeyPath:nil method:RKRequestMethodPOST];
    
    [manager addRequestDescriptor: requestDescriptor];
    
    [manager postObject:activity path:@"/activities/1/" parameters:nil success:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
        NSLog(@"\n\nSuccessfully posted to server!\n");
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        NSLog(@"\n\nFailed to post to server\n");
    }];
}

- (void) removeActivity:(Activity *)activity
{
    RKRequestDescriptor *requestDescriptor = [RKRequestDescriptor requestDescriptorWithMapping:[activityMapping inverseMapping] objectClass:[Activity class] rootKeyPath:nil method:RKRequestMethodDELETE];
    
    [manager addRequestDescriptor: requestDescriptor];
    
    [manager deleteObject:activity path:@"/activities/1/" parameters:nil success:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
        NSLog(@"\n\nSuccessfully removed activity from server!\n");
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        NSLog(@"\n\nNetwork fail\n");
    }];
}



@end
