//
//  GlobalNetwork.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <RestKit/RestKit.h>
#import "AppDelegate.h"
#import "Network.h"
#import "Activity.h"
#import "User.h"

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
        
        userMapping = [RKObjectMapping mappingForClass:[User class]];
        [userMapping addAttributeMappingsFromDictionary:@{
                                                              @"name": @"name",
                                                              @"user_id": @"user_id"
                                                              }];
        
    }
    return self;
}

- (void)getActivities:(GetActivitiesCallbackBlock) successCallback
{
    // Store a copy of the success callback
    GetActivitiesCallbackBlock _successCallback = [successCallback copy];
    
    // TODO: Move this to some kind of init in a nice way. It doesn't need to be called every time.
    // This defines a key path for {activity: {...}} objects, connecting activity objects with the activityMapping. Path pattern is the URL pattern this should be used to match against
    RKResponseDescriptor *responseDescriptor = [RKResponseDescriptor responseDescriptorWithMapping:activityMapping method:RKRequestMethodGET pathPattern:@"/activities/:userID/" keyPath:@"activity" statusCodes:RKStatusCodeIndexSetForClass(RKStatusCodeClassSuccessful)];
    
    [manager addResponseDescriptor:responseDescriptor];
    
    [manager getObjectsAtPath:@"/activities/1/" parameters:nil success:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
        // Call success callback with returned data!
        NSLog(@"Get Activities - success");
        _successCallback(mappingResult.array);
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        NSLog(@"Get Activities- Fail");
        // RKLogError(@"Operation failed with error: %@", error);
    }];
    
}

- (void)createActivity:(Activity *)activity
{    
    RKRequestDescriptor *requestDescriptor = [RKRequestDescriptor requestDescriptorWithMapping:[activityMapping inverseMapping] objectClass:[Activity class] rootKeyPath:nil method:RKRequestMethodPOST];
    
    [manager addRequestDescriptor: requestDescriptor];
    
    [manager postObject:activity path:@"/activities/1/" parameters:nil success:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
        NSLog(@"\n\nCreate Activity - success!\n");
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        NSLog(@"\n\nCreate Activity - fail\n");
    }];
}

- (void) removeActivity:(Activity *)activity
{
    RKRequestDescriptor *requestDescriptor = [RKRequestDescriptor requestDescriptorWithMapping:[activityMapping inverseMapping] objectClass:[Activity class] rootKeyPath:nil method:RKRequestMethodDELETE];
    
    [manager addRequestDescriptor: requestDescriptor];
    
    [manager deleteObject:activity path:@"/activities/" parameters:nil success:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
        NSLog(@"\n\nRemove Activity - success!\n");
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        NSLog(@"\n\nRemove Activity - fail\n");
    }];
}

- (void) loginWithFbToken:(NSString*)fbToken {
    NSDictionary *loginObject = [[NSDictionary alloc] initWithObjectsAndKeys:fbToken, @"fb_token", nil];
    
    AFHTTPClient *client = manager.HTTPClient;
    
    [client postPath:@"/login/" parameters:loginObject success:^(AFHTTPRequestOperation *operation, id responseObject) {
        // NSString *authToken = [responseObject objectForKey:@"token"];
        NSLog(@"Login - success");
    } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
        NSLog(@"Login - fail");
        // Pretend the login was successful and we can now access the user id and the token
        NSInteger userId = 0;
        NSString *token = @"myToken";
        NSString *name = @"myName";
        [self setAuthorizationToken:token userId:userId];
        User *me = ((AppDelegate*)[[UIApplication sharedApplication] delegate]).user;
        me.name = name;
        me.user_id = userId;
    }];
}

- (void) setAuthorizationToken:(NSString*)token userId:(NSInteger)userId {
    [manager.HTTPClient setDefaultHeader:@"user_id" value:[NSString stringWithFormat:@"%d", userId]];
    [manager.HTTPClient setDefaultHeader:@"token" value:token];
}

@end
